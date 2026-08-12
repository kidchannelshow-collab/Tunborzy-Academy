const fs = require('fs');
let content = fs.readFileSync('src/components/lecturer/CourseManagement.tsx', 'utf8');

// Just to avoid overly complex regex, let's use the UI changes we know we need.
// Wait, rather than scripting a 400 line file update, let's just use multi_edit_file or edit_file directly if possible.
