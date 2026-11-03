import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';

export class FreelancerController {
  static async getFreelancers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.getFreelancers();
      
      // Enrich freelancer profiles for marketplace UI
      const enriched = users.map((u: any) => ({
        ...u,
        title: u.name === 'Jordan Smith' ? 'Senior Brand & Vector Identity Specialist' : 'Full-Stack Developer & UI/UX Expert',
        hourlyRate: u.name === 'Jordan Smith' ? 75 : 85,
        rating: 4.9,
        reviewsCount: 38,
        completedProjects: 42,
        skills: u.name === 'Jordan Smith' 
          ? ['Vector Graphic Design', 'Brand Identity', 'SVG/PNG/PDF Master', 'Typography', 'Figma']
          : ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
        avatar: u.name === 'Jordan Smith' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        available: true,
      }));

      res.json({
        success: true,
        data: enriched,
      });
    } catch (error) {
      next(error);
    }
  }
}

