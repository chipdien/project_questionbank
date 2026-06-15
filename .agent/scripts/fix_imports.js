const fs = require('fs');
const path = require('path');

const files = [
    "src/lib/utils/export-utils.ts",
    "src/app/(main)/question-bank/page.tsx",
    "src/app/(main)/collection/[id]/page.tsx",
    "src/app/(main)/question-bank/components/QuestionsDataGrid.tsx",
    "src/app/(main)/question-bank/components/QuestionsManager.tsx",
    "src/app/(main)/question-bank/components/QuestionBankManager.tsx",
    "src/app/(main)/page.tsx",
    "src/app/(main)/documents/page.tsx"
];

files.forEach(f => {
    try {
        const fullPath = path.join(__dirname, '..', '..', f);
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/@\/app\/question-bank/g, '@/app/(main)/question-bank');
        content = content.replace(/@\/app\/documents/g, '@/app/(main)/documents');
        content = content.replace(/@\/app\/collection/g, '@/app/(main)/collection');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${f}`);
    } catch (e) {
        console.error(`Failed to update ${f}`, e.message);
    }
});
