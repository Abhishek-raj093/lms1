import { clerkClient } from '@clerk/express';
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';
import { Purchase } from '../models/Purchase.js';
import User  from '../models/User.js';

// Update role to educator
export const updateRoleToEducator = async (req, res)=>{
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: "You can publish a courses now" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Add New Course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile) {
            return res.json({ success: false, message: "Thumbnail Not Attached" })
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({ success: true, message: "Course Added Successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId
        const courses = await Course.find({ educator })
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        // Fetch all courses by educator
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;

        // Collect course IDs for further queries
        const courseIds = courses.map(course => course._id);

        // Fetch all completed purchases for the educator's courses
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        // Calculate total earnings
        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Fetch enrolled students and their respective course titles
        const enrolledStudentsData = await Promise.all(
            courses.map(async (course) => {
                const students = await User.find(
                    { _id: { $in: course.enrolledStudents } },
                    'name imageUrl'
                );
                return students.map(student => ({
                    student,
                    courseTitle: course.courseTitle
                }));
            })
        );

        // Flatten the array of arrays
        const flattenedEnrolledStudentsData = enrolledStudentsData.flat();

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData: flattenedEnrolledStudentsData,
                totalCourses
            }
        });

    } catch (error) {
        console.error('Error in educatorDashboardData:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Enrolled Students Data With Purchase Data
export const getEnrolledStudentsData = async (req, res)=>{
    try {
        const educator = req.auth.userId
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });
        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}