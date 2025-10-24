import prisma from '../config/database';

// Simple skill matching service
export const calculateSkillMatch = async (userId: string, taskId: string) => {
  try {
    // For now, return a mock skill match based on task category
    // This simulates skill matching without complex database queries
    const task = await prisma.task.findUnique({
      where: { taskId },
      select: { category: true }
    });

    if (!task) {
      return null;
    }

    // Mock skill matching logic - in a real implementation, this would:
    // 1. Get user's skills from userSkills table
    // 2. Get task's required skills from taskSkills table  
    // 3. Calculate match percentage based on skill overlap
    // 4. Return match score and details

    // For demo purposes, return a mock match based on category
    const mockMatchScore = Math.random() * 0.8 + 0.2; // Random score between 0.2-1.0
    
    return {
      totalScore: mockMatchScore,
      matches: [
        {
          skillName: `${task.category} Experience`,
          matchScore: mockMatchScore,
          requiredLevel: 'INTERMEDIATE',
          userLevel: 'ADVANCED'
        }
      ]
    };
  } catch (error) {
    console.error('Error calculating skill match:', error);
    return null;
  }
};
