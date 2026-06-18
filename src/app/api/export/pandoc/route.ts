import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { getS3ObjectBytes } from '@/lib/utils/s3.utils';
import { getS3ObjectRefFromProxyUrl, getS3ObjectRefFromUrl } from '@/lib/utils/s3-url.utils';

const execAsync = util.promisify(exec);

const escapeLatex = (str: any): string => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde ')
    .replace(/\^/g, '\\textasciicircum ');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const markdownContent = body.markdown;
    const metadata = body.metadata || {};

    if (!markdownContent) {
      return NextResponse.json({ error: 'Missing markdown content' }, { status: 400 });
    }

    // Sinh UUID tạo thư mục tmp
    const reqId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `pandoc_export_${reqId}`);

    await fs.mkdir(tmpDir, { recursive: true });

    const mdFilePath = path.join(tmpDir, 'document.md');
    const pdfFilePath = path.join(tmpDir, 'document.pdf');

    // 0. Copy local logos to tmpDir for Pandoc to access
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');
    const logo1Path = path.join(publicImagesDir, 'logo-template-docx.png');
    const logo2Path = path.join(publicImagesDir, 'logo-vietelite.png');

    try {
      if (fsSync.existsSync(logo1Path)) await fs.copyFile(logo1Path, path.join(tmpDir, 'logo-primary.png'));
      if (fsSync.existsSync(logo2Path)) await fs.copyFile(logo2Path, path.join(tmpDir, 'logo-secondary.png'));
    } catch (err) {
      console.error("Error copying local logos:", err);
    }

    // Config YAML block cho pandoc
    const pandocYaml = `---
papersize: a4
geometry: left=3cm, right=2cm, top=0.3cm, bottom=2cm, headheight=95pt, headsep=15pt, includehead, includefoot
---

\\thispagestyle{firstpage}
\n`;

    const footerLatex = `
\\fancyfoot[C]{\\hrule\\vspace{0.2cm}\\begin{tabular*}{\\linewidth}{@{\\extracolsep{\\fill}}llll}\\raisebox{-0.3\\height}{\\includegraphics[height=0.4cm]{logo-primary.png}} \\textbf{VIETELITE} & \\textbf{024.7306.5565} & \\textbf{info@vietelite.edu.vn} & \\textbf{www.vietelite.edu.vn}\\end{tabular*}}
\\fancyfoot[R]{\\textit{Trang \\thepage / \\pageref{LastPage}}}
`;

    const headerTexPath = path.join(tmpDir, 'header.tex');
    const headerTexContent = `
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{fontspec}
\\usepackage{unicode-math}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage{fancyhdr}
\\usepackage{xcolor}
\\usepackage{lastpage}
\\usepackage{array}
\\usepackage{colortbl}
\\definecolor{vegreen}{HTML}{00A651}
\\definecolor{vegray}{HTML}{595959}
\\definecolor{vegraylight}{HTML}{7F7F7F}

\\pagestyle{fancy}
\\fancyhf{}
% Secondary Header (Pages 2+)
\\fancyhead[L]{
  \\begin{minipage}{\\linewidth}
    \\vspace*{-0.2cm}
    \\begin{tabular*}{\\linewidth}{@{} l @{\\extracolsep{\\fill}} r @{}}
      \\raisebox{-0.3\\height}{\\includegraphics[height=1.1cm]{logo-secondary.png}} & 
      \\begin{minipage}[b]{0.7\\linewidth}
        \\raggedleft
        {\\fontsize{13}{14}\\selectfont \\textbf{\\textcolor{vegray}{HỆ THỐNG GIÁO DỤC VIETELITE}}} \\\\
        \\vspace{0.05cm}
        {\\fontsize{10}{11}\\selectfont \\textit{\\textcolor{vegraylight}{Khởi đầu thành công}}}
      \\end{minipage}
    \\end{tabular*}
    \\vspace{1pt}
    {\\color{vegreen}\\hrule height 1.5pt}
    \\vspace{1pt}
    \\raggedleft {\\fontsize{8}{9}\\selectfont \\textcolor{vegray}{Tài liệu học tập – Lưu hành nội bộ}}
  \\end{minipage}
}
\\fancyhead[R]{} 
${footerLatex}
\\renewcommand{\\headrulewidth}{0pt}

\\fancypagestyle{firstpage}{
  \\fancyhf{}
  \\fancyhead[C]{
    \\noindent
    \\begin{tabular*}{\\linewidth}{@{} p{0.10\\linewidth} @{\\extracolsep{\\fill}} p{0.58\\linewidth} @{\\extracolsep{\\fill}} p{0.32\\linewidth} @{}}
    \\raisebox{-0.5\\height}{\\includegraphics[width=\\linewidth]{logo-primary.png}} &
    \\begin{minipage}[t]{\\linewidth}
    \\centering
    {\\fontsize{12}{14}\\selectfont \\textbf{\\textcolor{vegray}{HỆ THỐNG GIÁO DỤC VIETELITE}}} \\\\
    \\vspace{0.2cm}
    {\\fontsize{9}{10}\\selectfont VIETELITE EDUCATION} \\\\
    \\vspace{0.3cm}
    \\fbox{\\textbf{TÀI LIỆU HỌC TẬP}} \\\\
    \\vspace{0.2cm}
    {\\fontsize{8}{9}\\selectfont \\textit{Tài liệu gồm \\textbf{\\pageref{LastPage}} trang}}
    \\end{minipage} &
    \\begin{minipage}[t]{\\linewidth}
    \\fontsize{8.5}{13.5}\\selectfont
    Môn học: \\textbf{${escapeLatex(metadata.subject || '................')}} \\\\
    Lớp: \\textbf{${escapeLatex(metadata.classCode || '..........')}} \\\\
    Giáo viên: \\textbf{${escapeLatex(metadata.teacher || '..........................')}} \\\\
    Nội dung: \\textbf{${escapeLatex(metadata.topic || '..........................')}} \\\\
    Ngày học: \\textbf{${escapeLatex(metadata.dateRange || '..........................')}} \\\\
    Học sinh: \\hrulefill
    \\end{minipage}
    \\end{tabular*}
    \\vspace{0.2cm}
    \\arrayrulecolor{vegreen}\\hrule height 1pt
  }
  ${footerLatex}
  \\renewcommand{\\headrulewidth}{0pt}
}
\\makeatletter
\\def\\maxwidth{0.8\\linewidth}
\\def\\maxheight{0.8\\textheight}
\\makeatother
`;
    await fs.writeFile(headerTexPath, headerTexContent);;

    let processedMd = markdownContent;
    let imgCounter = 0;

    const getImageExtension = (source: string, contentType?: string | null): string => {
      let ext = source.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
      if (ext.length > 4 || !ext.match(/^[a-z0-9]+$/i)) {
        ext = contentType?.split('/')[1] || 'jpg';
      }
      return ext === 'jpeg' ? 'jpg' : ext;
    };

    const saveImage = async (buffer: Buffer, source: string, contentType?: string | null): Promise<string> => {
      const ext = getImageExtension(source, contentType);
      const imgName = `image${imgCounter++}.${ext}`;
      const imgPath = path.join(tmpDir, imgName);
      await fs.writeFile(imgPath, buffer);
      return imgName;
    };

    // Helper xu ly URL anh, tra ve ten file
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
        const s3Ref = getS3ObjectRefFromProxyUrl(actualUrl, req.url) || getS3ObjectRefFromUrl(actualUrl);
        if (s3Ref) {
          const object = await getS3ObjectBytes(s3Ref.key, s3Ref.bucket);
          return await saveImage(Buffer.from(object.body), s3Ref.key, object.contentType);
        }

        const resolvedUrl = actualUrl.startsWith('/') ? new URL(actualUrl, req.url).toString() : actualUrl;
        const headers = new Headers();
        if (resolvedUrl.startsWith(new URL(req.url).origin)) {
          const cookie = req.headers.get('cookie');
          if (cookie) headers.set('cookie', cookie);
        }

        const res = await fetch(resolvedUrl, { headers });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const contentType = res.headers.get('content-type');
        const buffer = Buffer.from(await res.arrayBuffer());

        return await saveImage(buffer, resolvedUrl, contentType);
      } catch (e: any) {
        console.error('Loi download anh: ', actualUrl, e.message);
        return null;
      }
    };

    // 1. Phân tích ảnh dạng markdown ![]()
    const mdMatches = [...markdownContent.matchAll(/!\[(.*?)\]\(([^)]+)\)/g)];
    for (const match of mdMatches) {
      const fullMatch = match[0];
      const url = match[2];
      if (url.startsWith('data:')) continue;

      const imgName = await downloadImage(url);
      if (imgName) {
        const latexBlock = `\n\n\\begin{center}\n\\includegraphics[width=0.8\\linewidth,keepaspectratio]{${imgName}}\n\\end{center}\n\n`;
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
        const latexBlock = `\n\n\\begin{center}\n\\includegraphics[width=0.8\\linewidth,keepaspectratio]{${imgName}}\n\\end{center}\n\n`;
        processedMd = processedMd.replace(fullMatch, latexBlock);
      }
    }

    // 3. Append slogan at the end of document
    processedMd += '\n\n\\vspace{2cm}\n\n\\begin{center}\\textbf{SHINE YOUR WAY}\\end{center}';

    await fs.writeFile(mdFilePath, pandocYaml + processedMd);

    // Gọi pandoc render PDF qua XeLaTeX (để hỗ trợ Unicode TV)
    const pandocCommand = `pandoc "${mdFilePath}" -H "${headerTexPath}" -o "${pdfFilePath}" --pdf-engine=xelatex`;

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
