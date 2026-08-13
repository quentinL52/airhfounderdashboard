const fs = require('fs');
const file = 'src/lib/ai/core-agent.ts';
let content = fs.readFileSync(file, 'utf8');

// Only match parameters: z.object( ... )
content = content.replace(/parameters:\s*z\.object\(\{([\s\S]*?)\}\),/g, 'parameters: zodSchema(z.object({$1})),');

fs.writeFileSync(file, content);
console.log('Fixed read_dashboard_tab parameters with zodSchema');
