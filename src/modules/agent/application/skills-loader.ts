import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

const SkillFrontmatterSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  tools: z.array(z.string()).default([]),
});

export type Skill = z.infer<typeof SkillFrontmatterSchema> & {
  content: string;
};

const SKILLS_DIR = path.join(process.cwd(), 'src', 'lib', 'ai', 'skills');

export async function loadSkills(): Promise<Skill[]> {
  try {
    const files = await fs.readdir(SKILLS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const skills: Skill[] = [];

    for (const file of mdFiles) {
      const filePath = path.join(SKILLS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');

      const { data, content } = matter(fileContent);

      try {
        const parsedData = SkillFrontmatterSchema.parse(data);
        skills.push({
          ...parsedData,
          content: content.trim(),
        });
      } catch (err) {
        console.error(`Invalid frontmatter in skill file ${file}:`, err);
      }
    }

    return skills;
  } catch (err) {
    console.error('Failed to load skills directory:', err);
    return [];
  }
}

export async function getSkillById(id: string): Promise<Skill | null> {
  const skills = await loadSkills();
  return skills.find(s => s.id === id) || null;
}
