/**
 * Handles the complete flow of uploading a PDF Blob to S3 and saving its metadata.
 * 
 * @param pdfBlob The Blob object containing the PDF content.
 * @param fileName The desired filename (without or with .pdf extension).
 * @param title The title of the document to be saved in the database.
 * @param questionIds Lấy danh sách ID của các câu hỏi thuộc đề thi này.
 * @returns The saved exam API response object.
 */
export async function handleSavePDF(pdfBlob: Blob, fileName: string, title: string, questionIds: number[]) {
  try {
    console.log("1. Requesting Presigned URL from Server...");
    
    // Ensure filename has .pdf extension
    const formattedFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    const contentType = pdfBlob.type || "application/pdf";

    // Call API Route 1
    const presignedRes = await fetch("/api/s3/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: formattedFileName,
        contentType,
      }),
    });

    if (!presignedRes.ok) {
        const error = await presignedRes.json();
        throw new Error(error.error || "Failed to get presigned URL from server");
    }

    const { signedUrl, objectKey, url } = await presignedRes.json();
    console.log("Presigned URL received! (Hidden for security)");

    console.log("2. Uploading PDF directly to S3...");
    
    // Call AWS S3 API via Presigned URL
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: pdfBlob,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`S3 Upload failed with status ${uploadRes.status}`);
    }
    console.log("Upload to S3 successful!");

    console.log("3. Saving metadata to Database...");
    
    // Call API Route 2
    const dbRes = await fetch("/api/exams/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        s3ObjectKey: objectKey,
        s3Url: url,
        questionIds, // Pass the array of question IDs
      }),
    });

    if (!dbRes.ok) {
      const error = await dbRes.json();
      throw new Error(error.error || "Failed to save file metadata to database");
    }

    const savedData = await dbRes.json();
    console.log("✅ PDF Flow completed successfully!", savedData);
    
    return savedData;
  } catch (error) {
    console.error("❌ Error in handleSavePDF flow:", error);
    throw error;
  }
}
