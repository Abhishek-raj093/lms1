import express from 'express';
import { updateRoleToEducator } from '../controllers/educatorController.js';

const educatorRouter = express.Router();

// Add Educator Role
educatorRouter.post('/update-role', updateRoleToEducator);

export default educatorRouter;