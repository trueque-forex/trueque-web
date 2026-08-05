const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/dashboard.tsx', 'utf8');

// 1. Add withAuth
code = code.replace('import { useRouter } from \'next/router\';', 'import { useRouter } from \'next/router\';\nimport { withAuth } from \'../../lib/withAuth\';');

// 2. Change fetch endpoints
code = code.replace(/'http:\/\/localhost:8000\/api\/admin/g, '\'/api/admin');

// 3. Add getServerSideProps
code += '\nexport const getServerSideProps = withAuth(async (ctx: any) => {\n';
code += '    console.log("[SSR DASHBOARD] Session UserType:", ctx.session?.user?.userType);\n';
code += '    if (ctx.session?.user?.userType !== \'ADMIN\') {\n';
code += '        return {\n';
code += '            redirect: {\n';
code += '                destination: \'/dashboard\',\n';
code += '                permanent: false,\n';
code += '            },\n';
code += '        };\n';
code += '    }\n';
code += '    return { props: {} };\n';
code += '});\n';

fs.writeFileSync('src/pages/admin/dashboard.tsx', code);
console.log('done');
