const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
const formHtml = `
    <!-- Hidden form to let Netlify know about our custom form submissions -->
    <form name="registrations" data-netlify="true" hidden>
      <input type="text" name="uid" />
      <input type="text" name="role" />
      <input type="text" name="phone" />
      <input type="email" name="email" />
    </form>
`;
html = html.replace('<body>', '<body>' + formHtml);
fs.writeFileSync('index.html', html);
