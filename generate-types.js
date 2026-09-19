import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Define your exact entry points and where they should go
const tasks = [
  { input: 'src/core/index.js', output: 'dist/core.d.ts' },
  { input: 'src/wrapper/index.js', output: 'dist/wrapper.d.ts' }
];

// Create a clean temporary directory for the tsc output
const tempDir = path.join(process.cwd(), '.tsc-temp');

try {
  // 2. Loop through each entry point individually
  tasks.forEach(task => {
    console.log(`Extracting types from: ${task.input}...`);
    
    // Clean up temp directory before running
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

    // Run native tsc targeting just this file, forcing it to ignore other files via --noResolve
    execSync(`npx tsc ${task.input} --declaration --allowJs --emitDeclarationOnly --noResolve --outDir ${tempDir}`, { stdio: 'inherit' });

    // Find the generated file inside the temp folder (e.g. index.d.ts or admin.d.ts)
    const baseName = path.basename(task.input, path.extname(task.input)) + '.d.ts';
    const generatedFilePath = path.join(tempDir, baseName);

    if (fs.existsSync(generatedFilePath)) {
      // Ensure the target directory exists
      const targetDir = path.dirname(task.output);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      // Copy the file to your exact custom name and flat location
      fs.copyFileSync(generatedFilePath, task.output);
      console.log(`✓ Successfully saved to: ${task.output}`);
    } else {
      console.error(`✕ Failed to find generated types for ${task.input}`);
    }
  });

} catch (error) {
  console.error('Error generating types:', error.message);
} finally {
  // Clean up the temp directory when finished
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}
