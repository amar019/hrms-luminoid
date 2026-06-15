const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(/import\s+{.*toast.*}\s+from\s+['"]react-toastify['"];?/g, "import Swal from 'sweetalert2';");

  // Regex to match toast.xxx(message, { options })
  // We use a simple approach: find `toast.` and manually replace it in a loop
  
  // Replace dismiss
  content = content.replace(/toast\.dismiss\([^)]*\)/g, 'Swal.close()');

  // We know these files have specific toast calls:
  content = content.replace(/toast\.success\(([^,]+),\s*{[^}]*}\)/g, "Swal.fire({ icon: 'success', title: 'Success', text: $1, timer: 2000, showConfirmButton: false })");
  content = content.replace(/toast\.error\(([^,]+),\s*{[^}]*}\)/g, "Swal.fire({ icon: 'error', title: 'Error', text: $1 })");
  content = content.replace(/toast\.info\(([^,]+),\s*{[^}]*}\)/g, "Swal.fire({ icon: 'info', title: 'Info', text: $1 })");
  content = content.replace(/toast\.warning\(([^,]+),\s*{[^}]*}\)/g, "Swal.fire({ icon: 'warning', title: 'Warning', text: $1 })");
  
  // Also standard ones without options
  content = content.replace(/toast\.success\(([^,)]+)\)/g, "Swal.fire({ icon: 'success', title: 'Success', text: $1, timer: 2000, showConfirmButton: false })");
  content = content.replace(/toast\.error\(([^,)]+)\)/g, "Swal.fire({ icon: 'error', title: 'Error', text: $1 })");
  content = content.replace(/toast\.info\(([^,)]+)\)/g, "Swal.fire({ icon: 'info', title: 'Info', text: $1 })");
  content = content.replace(/toast\.warning\(([^,)]+)\)/g, "Swal.fire({ icon: 'warning', title: 'Warning', text: $1 })");

  fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('src/pages/FieldVisits.js');
fixFile('src/pages/SelfReportVisit.js');

console.log('Fixed files');
