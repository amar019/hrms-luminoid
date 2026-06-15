const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace imports
  if (content.includes("from 'react-toastify'") || content.includes('from "react-toastify"')) {
    // If it imports toast, we need to replace it with Swal if it's not already imported
    content = content.replace(/import\s+{.*toast.*}\s+from\s+['"]react-toastify['"];?/g, '');
    content = content.replace(/import\s+{.*ToastContainer.*}\s+from\s+['"]react-toastify['"];?/g, '');
    
    if (!content.includes("from 'sweetalert2'") && !content.includes('from "sweetalert2"')) {
      content = "import Swal from 'sweetalert2';\n" + content;
    }
    changed = true;
  }

  // Replace toast.success(...)
  const successRegex = /toast\.success\(([^)]+)\)/g;
  if (successRegex.test(content)) {
    content = content.replace(successRegex, "Swal.fire({ icon: 'success', title: 'Success', text: $1, timer: 2000, showConfirmButton: false })");
    changed = true;
  }

  // Replace toast.error(...)
  const errorRegex = /toast\.error\(([^)]+)\)/g;
  if (errorRegex.test(content)) {
    content = content.replace(errorRegex, "Swal.fire({ icon: 'error', title: 'Error', text: $1 })");
    changed = true;
  }
  
  // Replace toast.info(...)
  const infoRegex = /toast\.info\(([^)]+)\)/g;
  if (infoRegex.test(content)) {
    content = content.replace(infoRegex, "Swal.fire({ icon: 'info', title: 'Info', text: $1 })");
    changed = true;
  }
  
  // Replace toast.warn(...) or toast.warning(...)
  const warnRegex = /toast\.(?:warn|warning)\(([^)]+)\)/g;
  if (warnRegex.test(content)) {
    content = content.replace(warnRegex, "Swal.fire({ icon: 'warning', title: 'Warning', text: $1 })");
    changed = true;
  }
  
  // Replace `<ToastContainer />`
  if (content.includes('<ToastContainer') || content.includes('<ToastContainer>')) {
    content = content.replace(/<ToastContainer[^>]*>.*?<\/ToastContainer>/g, '');
    content = content.replace(/<ToastContainer[^>]*\/>/g, '');
    changed = true;
  }

  if (changed) {
    // Ensure Swal is imported if used
    if (content.includes('Swal.fire') && !content.includes('sweetalert2')) {
      content = "import Swal from 'sweetalert2';\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

traverse(directory);
console.log('Done!');
