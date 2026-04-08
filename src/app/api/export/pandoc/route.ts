import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const markdownContent = body.markdown;

    if (!markdownContent) {
      return NextResponse.json({ error: 'Missing markdown content' }, { status: 400 });
    }

    // Sinh UUID tạo thư mục tmp
    const reqId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `pandoc_export_${reqId}`);
    
    await fs.mkdir(tmpDir, { recursive: true });

    const mdFilePath = path.join(tmpDir, 'document.md');
    const pdfFilePath = path.join(tmpDir, 'document.pdf');
    
    // Config YAML block cho pandoc
    // Dùng geometry margin, config font hỗ trợ Tiếng Việt (Times New Roman hoặc font mặc định unicode)
    // Sẽ cần server có cài xelatex và package fontspec
    const pandocYaml = `---
geometry: margin=2cm
header-includes:
  - \\usepackage{amsmath}
  - \\usepackage{amssymb}
  - \\usepackage{fontspec}
  - \\usepackage{unicode-math}
  - \\usepackage{multicol}
  - \\usepackage{graphicx}
  - \\makeatletter
  - \\def\\maxwidth{\\ifdim\\Gin@nat@width>0.45\\linewidth0.45\\linewidth\\else\\Gin@nat@width\\fi}
  - \\def\\maxheight{\\ifdim\\Gin@nat@height>0.4\\textheight0.4\\textheight\\else\\Gin@nat@height\\fi}
  - \\makeatother
---
`;

    let processedMd = markdownContent;
    let imgCounter = 0;

    // Helper xử lý URL ảnh, trả về tên file
    const downloadImage = async (rawUrl: string): Promise<string | null> => {
      let actualUrl = rawUrl;
      if (rawUrl.includes('/api/proxy-image?url=')) {
        const urlParams = new URLSearchParams(rawUrl.split('?')[1]);
        const extracted = urlParams.get('url');
        if (extracted) {
           actualUrl = extracted;
        }
      }
      
      if (actualUrl.startsWith('//')) {
         actualUrl = 'https:' + actualUrl;
      }

      try {
        const res = await fetch(actualUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        
        const contentType = res.headers.get('content-type');
        const buffer = Buffer.from(await res.arrayBuffer());
        
        let ext = actualUrl.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
        if (ext.length > 4 || !ext.match(/^[a-z0-9]+$/i)) {
          ext = contentType?.split('/')[1] || 'jpg';
        }
        if (ext === 'jpeg') ext = 'jpg';
        
        const imgName = `img_${imgCounter++}.${ext}`;
        const imgPath = path.join(tmpDir, imgName);
        await fs.writeFile(imgPath, buffer);
        
        return imgName;
      } catch (e: any) {
        console.error("Lỗi download ảnh: ", actualUrl, e.message);
        return null;
      }
    };

    // 1. Phân tích ảnh dạng markdown ![]()
    // Lưu các match vào mảng để xử lý tuần tự, thay thế text gốc
    const mdMatches = [...markdownContent.matchAll(/!\[(.*?)\]\(([^)]+)\)/g)];
    for (const match of mdMatches) {
       const fullMatch = match[0];
       const alt = match[1];
       const url = match[2];
       if (url.startsWith('data:')) continue;

       const imgName = await downloadImage(url);
       if (imgName) {
          const latexBlock = `\n\n\`\`\`{=latex}\n\\begin{center}\n\`\`\`\n![](${imgName})\n\`\`\`{=latex}\n\\end{center}\n\`\`\`\n\n`;
          processedMd = processedMd.replace(fullMatch, latexBlock);
       }
    }

    // 2. Phân tích ảnh dạng html <img src="" />
    const htmlMatches = [...markdownContent.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)];
    for (const match of htmlMatches) {
       const fullMatch = match[0];
       const url = match[1];
       if (url.startsWith('data:')) continue;

       const imgName = await downloadImage(url);
       if (imgName) {
          const latexBlock = `\n\n\`\`\`{=latex}\n\\begin{center}\n\`\`\`\n![](${imgName})\n\`\`\`{=latex}\n\\end{center}\n\`\`\`\n\n`;
          processedMd = processedMd.replace(fullMatch, latexBlock);
       }
    }

    await fs.writeFile(mdFilePath, pandocYaml + processedMd);

    // Gọi pandoc render PDF qua XeLaTeX (để hỗ trợ Unicode TV)
    const pandocCommand = `pandoc "${mdFilePath}" -o "${pdfFilePath}" --pdf-engine=xelatex`;
    
    await execAsync(pandocCommand, { cwd: tmpDir });

    const pdfBuffer = await fs.readFile(pdfFilePath);

    // Cleanup 
    fs.rm(tmpDir, { recursive: true, force: true }).catch(err => console.error("Error cleaning tmp: ", err));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Document.pdf"',
      },
    });

  } catch (error: any) {
    console.error('Lỗi khi Pipeline xuất PDF:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi render PDF' }, { status: 500 });
  }
}
