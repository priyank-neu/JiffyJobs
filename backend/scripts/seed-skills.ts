import { PrismaClient, TaskCategory } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const skills = [
  // Home Repair
  { name: 'Plumbing', category: TaskCategory.HOME_REPAIR },
  { name: 'Electrical Work', category: TaskCategory.HOME_REPAIR },
  { name: 'Carpentry', category: TaskCategory.HOME_REPAIR },
  { name: 'Painting', category: TaskCategory.HOME_REPAIR },
  
  // Cleaning
  { name: 'House Cleaning', category: TaskCategory.CLEANING },
  { name: 'Deep Cleaning', category: TaskCategory.CLEANING },
  { name: 'Window Cleaning', category: TaskCategory.CLEANING },
  { name: 'Carpet Cleaning', category: TaskCategory.CLEANING },
  
  // Moving
  { name: 'Moving & Packing', category: TaskCategory.MOVING },
  { name: 'Furniture Moving', category: TaskCategory.MOVING },
  { name: 'Loading/Unloading', category: TaskCategory.MOVING },
  
  // Delivery
  { name: 'Grocery Shopping', category: TaskCategory.DELIVERY },
  { name: 'Package Delivery', category: TaskCategory.DELIVERY },
  { name: 'Food Delivery', category: TaskCategory.DELIVERY },
  { name: 'Errands', category: TaskCategory.DELIVERY },
  
  // Assembly
  { name: 'Furniture Assembly', category: TaskCategory.ASSEMBLY },
  { name: 'IKEA Assembly', category: TaskCategory.ASSEMBLY },
  { name: 'Equipment Setup', category: TaskCategory.ASSEMBLY },
  
  // Yard Work
  { name: 'Landscaping', category: TaskCategory.YARD_WORK },
  { name: 'Lawn Mowing', category: TaskCategory.YARD_WORK },
  { name: 'Garden Maintenance', category: TaskCategory.YARD_WORK },
  { name: 'Snow Removal', category: TaskCategory.YARD_WORK },
  
  // Pet Care
  { name: 'Dog Walking', category: TaskCategory.PET_CARE },
  { name: 'Pet Sitting', category: TaskCategory.PET_CARE },
  { name: 'Pet Grooming', category: TaskCategory.PET_CARE },
  
  // Tech Support
  { name: 'Computer Repair', category: TaskCategory.TECH_SUPPORT },
  { name: 'Software Installation', category: TaskCategory.TECH_SUPPORT },
  { name: 'Network Setup', category: TaskCategory.TECH_SUPPORT },
  { name: 'Website Development', category: TaskCategory.TECH_SUPPORT },
  { name: 'Mobile App Development', category: TaskCategory.TECH_SUPPORT },
  { name: 'Data Entry', category: TaskCategory.TECH_SUPPORT },
  { name: 'Graphic Design', category: TaskCategory.TECH_SUPPORT },
  { name: 'Video Editing', category: TaskCategory.TECH_SUPPORT },
  
  // Tutoring
  { name: 'Math Tutoring', category: TaskCategory.TUTORING },
  { name: 'Language Tutoring', category: TaskCategory.TUTORING },
  { name: 'Music Lessons', category: TaskCategory.TUTORING },
  { name: 'Test Preparation', category: TaskCategory.TUTORING },
  { name: 'Computer Training', category: TaskCategory.TUTORING },
  
  // Other
  { name: 'General Labor', category: TaskCategory.OTHER },
  { name: 'Organization', category: TaskCategory.OTHER },
  { name: 'Research', category: TaskCategory.OTHER },
  { name: 'Writing', category: TaskCategory.OTHER },
  { name: 'Translation', category: TaskCategory.OTHER },
  { name: 'Event Planning', category: TaskCategory.OTHER },
  { name: 'Photography', category: TaskCategory.OTHER },
  { name: 'Personal Training', category: TaskCategory.OTHER },
];

async function seedSkills() {
  console.log('🌱 Seeding skills...');

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        category: skill.category,
      },
      create: {
        name: skill.name,
        category: skill.category,
      },
    });
    console.log(`✅ Added/Updated skill: ${skill.name}`);
  }

  console.log(`\n✨ Successfully seeded ${skills.length} skills!`);
}

seedSkills()
  .catch((e) => {
    console.error('❌ Error seeding skills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

