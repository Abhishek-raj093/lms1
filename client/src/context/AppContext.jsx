import React, { useEffect } from 'react';
import { useState } from 'react';
import { createContext } from "react";
import { dummyCourses } from '../assets/assets';

export const AppContext = createContext()

export const AppContextProvider = (props)=>{

    const currency = import.meta.env.VITE_CURRENCY

    const [allCourses, setAllCourses] = useState([])

    // Fetch all courses
    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses)
    }

    useEffect(()=>{
        fetchAllCourses()
    },[])

    const value = {
        currency, allCourses
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}