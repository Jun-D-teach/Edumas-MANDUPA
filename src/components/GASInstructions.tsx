/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, FileSpreadsheet, Eye, HelpCircle } from 'lucide-react';

export const GASInstructions: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const appsScriptCode = `/*
  Kawal Madrasah - Google Apps Script Backend integration
  Salin seluruh kode ini ke Google Apps Script (Extensions -> Apps Script pada Google Sheet Anda).
  Simpan kemudian Deploy sebagai Web App:
  1. Klik "Deploy" -> "New deployment"
  2. Pilih type "Web app"
  3. Set "Execute as" ke "Me (email anda)"
  4. Set "Who has access" ke "Anyone" (Agar sistem web app dapat melakukan input tanpa login Google)
  5. Salin URL Web App yang dihasilkan, masukkan ke dalam konfigurasi admin aplikasi Kawal Madrasah.
*/

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "running", message: "Kawal Madrasah Apps Script Active." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var data = requestData.data;
    
    // Inisialisasi Sheet otomatis jika belum ada
    initSheets();

    switch (action) {
      case "sendVerification":
        return sendVerificationEmail(data.email, data.name, data.code);
      case "addUser":
        return saveUserToSheet(data);
      case "addComplaint":
        return saveComplaintToSheet(data.complaint, data.log);
      case "updateComplaint":
        return updateComplaintInSheet(data.complaint, data.log);
      case "getComplaints":
        return getComplaintsFromSheet();
      case "getUsers":
        return getUsersFromSheet();
      case "getLogs":
        return getLogsFromSheet();
      default:
        return errorResponse("Aksi tidak didukung: " + action);
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

// Inisialisasi Sheet dan kolom-kolomnya jika kosong
function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Users
  var userSheet = ss.getSheetByName("Users");
  if (!userSheet) {
    userSheet = ss.insertSheet("Users");
    userSheet.appendRow(["ID", "Email", "Nama", "Peran", "Status Verifikasi", "Tanggal Registrasi"]);
    userSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#d1fae5");
  }
  
  // Sheet Complaints
  var compSheet = ss.getSheetByName("Complaints");
  if (!compSheet) {
    compSheet = ss.insertSheet("Complaints");
    compSheet.appendRow([
      "ID", "Nomor Tiket", "Nama Pelapor", "Email Pelapor", "Kategori", 
      "Sub Kategori", "Judul", "Keterangan", "Anonim", "Status", 
      "Jawaban Informasi Langsung", "Tanggapan Bidang", "Jawaban Akhir", 
      "Bidang Terkait", "Tanggal Dibuat", "Tanggal Diupdate"
    ]);
    compSheet.getRange("A1:P1").setFontWeight("bold").setBackground("#d1fae5");
  }
  
  // Sheet Logs
  var logSheet = ss.getSheetByName("Logs");
  if (!logSheet) {
    logSheet = ss.insertSheet("Logs");
    logSheet.appendRow(["ID", "ID Pengaduan", "Nama Aktor", "Peran Aktor", "Tindakan", "Catatan", "Waktu"]);
    logSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#d1fae5");
  }
}

function sendVerificationEmail(email, name, code) {
  try {
    var subject = "[Kawal Madrasah] Kode Verifikasi Email Pendaftaran Pengaduan";
    var htmlBody = "<h3>Assalamu'alaikum " + name + ",</h3>" +
      "<p>Terima kasih telah mendaftar di Layanan Pengaduan Masyarakat Kawal Madrasah.</p>" +
      "<p>Berikut adalah <b>KODE VERIFIKASI</b> Anda untuk melanjutkan pendaftaran akun:</p>" +
      "<h2 style='color:#10b981; font-family:monospace; background-color:#f3f4f6; display:inline-block; padding:10px 20px; border-radius:5px;'>" + code + "</h2>" +
      "<p>Mohon masukkan kode ini pada form verifikasi di sistem utama.</p>" +
      "<p><i>Layanan ini dijamin aman, rahasia, dan memfasilitasi pelaporan demi kebaikan bersama di lingkungan Madrasah.</i></p>" +
      "<br><p>Wassalamu'alaikum,<br><b>Tim Pengaduan Kawal Madrasah</b></p>";
      
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    return jsonResponse({ success: true, message: "Email verifikasi dikirim." });
  } catch (err) {
    return errorResponse("Gagal mengirim email: " + err.toString());
  }
}

function saveUserToSheet(user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  
  // Cek apakah user dengan email tersebut sudah terdaftar untuk update, jika tidak append baru
  var range = sheet.getDataRange();
  var values = range.getValues();
  var foundRow = -1;
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][1].toString().toLowerCase() === user.email.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }
  
  var statusVerif = user.isVerified ? "TERVERIFIKASI" : "BELUM VERIFIKASI";
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 5).setValue(statusVerif);
  } else {
    sheet.appendRow([
      user.id,
      user.email,
      user.name,
      user.role,
      statusVerif,
      user.createdAt
    ]);
  }
  
  return jsonResponse({ success: true });
}

function saveComplaintToSheet(complaint, log) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var compSheet = ss.getSheetByName("Complaints");
  
  compSheet.appendRow([
    complaint.id,
    complaint.ticketNumber,
    complaint.pelaporName,
    complaint.pelaporEmail,
    complaint.category,
    complaint.subCategory,
    complaint.title,
    complaint.description,
    complaint.anonymous ? "YA" : "TIDAK",
    complaint.status,
    complaint.directInfoAnswer || "",
    complaint.departmentResponse || "",
    complaint.finalAnswer || "",
    complaint.assignedDepartment || "",
    complaint.createdAt,
    complaint.updatedAt
  ]);
  
  // Append log
  var logSheet = ss.getSheetByName("Logs");
  logSheet.appendRow([
    log.id,
    log.complaintId,
    log.actorName,
    log.actorRole,
    log.action,
    log.notes,
    log.timestamp
  ]);
  
  return jsonResponse({ success: true });
}

function updateComplaintInSheet(complaint, log) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var compSheet = ss.getSheetByName("Complaints");
  
  var range = compSheet.getDataRange();
  var values = range.getValues();
  var foundRow = -1;
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === complaint.id) {
      foundRow = i + 1;
      break;
    }
  }
  
  if (foundRow > 0) {
    compSheet.getRange(foundRow, 10).setValue(complaint.status); // Column J: Status
    compSheet.getRange(foundRow, 11).setValue(complaint.directInfoAnswer || ""); // Column K: Info Answer
    compSheet.getRange(foundRow, 12).setValue(complaint.departmentResponse || ""); // Column L: Dept Response
    compSheet.getRange(foundRow, 13).setValue(complaint.finalAnswer || ""); // Column M: Final Answer
    compSheet.getRange(foundRow, 14).setValue(complaint.assignedDepartment || ""); // Column N: Assigned Dept
    compSheet.getRange(foundRow, 16).setValue(complaint.updatedAt); // Column P: Updated At
  }
  
  // Append log
  var logSheet = ss.getSheetByName("Logs");
  logSheet.appendRow([
    log.id,
    log.complaintId,
    log.actorName,
    log.actorRole,
    log.action,
    log.notes,
    log.timestamp
  ]);
  
  return jsonResponse({ success: true });
}

function getComplaintsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Complaints");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    list.push({
      id: values[i][0].toString(),
      ticketNumber: values[i][1].toString(),
      pelaporName: values[i][2].toString(),
      pelaporEmail: values[i][3].toString(),
      category: values[i][4].toString(),
      subCategory: values[i][5].toString(),
      title: values[i][6].toString(),
      description: values[i][7].toString(),
      anonymous: values[i][8].toString() === "YA",
      status: values[i][9].toString(),
      directInfoAnswer: values[i][10] ? values[i][10].toString() : "",
      departmentResponse: values[i][11] ? values[i][11].toString() : "",
      finalAnswer: values[i][12] ? values[i][12].toString() : "",
      assignedDepartment: values[i][13] ? values[i][13].toString() : "",
      createdAt: values[i][14] ? values[i][14].toString() : "",
      updatedAt: values[i][15] ? values[i][15].toString() : ""
    });
  }
  return jsonResponse(list);
}

function getUsersFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    list.push({
      id: values[i][0].toString(),
      email: values[i][1].toString(),
      name: values[i][2].toString(),
      role: values[i][3].toString(),
      isVerified: values[i][4].toString() === "TERVERIFIKASI",
      createdAt: values[i][5] ? values[i][5].toString() : ""
    });
  }
  return jsonResponse(list);
}

function getLogsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Logs");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    list.push({
      id: values[i][0].toString(),
      complaintId: values[i][1].toString(),
      actorName: values[i][2].toString(),
      actorRole: values[i][3].toString(),
      action: values[i][4].toString(),
      notes: values[i][5].toString(),
      timestamp: values[i][6] ? values[i][6].toString() : ""
    });
  }
  return jsonResponse(list);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="gas-instructions-block">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Kode Integrasi Google Sheets (Apps Script)</h3>
            <p className="text-xs text-slate-500">Konfigurasi sheet dan verifikasi email otomatis</p>
          </div>
        </div>

        <button
          onClick={() => setShowScript(!showScript)}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          {showScript ? 'Sembunyikan Program' : 'Lihat Program'}
        </button>
      </div>

      <div className="p-5">
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Langkah Pemasangan</h4>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 mb-4 leading-relaxed">
          <li>Buatlah satu berkas <b>Google Spreadsheet</b> baru di Google Drive Anda.</li>
          <li>Di menu atas Google Sheet, klik <b>Ekstensi (Extensions)</b> → <b>Apps Script</b>.</li>
          <li>Hapus semua kode bawaan di editor, lalu paste kode program dari tombol di bawah ini.</li>
          <li>Klik icon ikon <b>Simpan (Save/Floppy Disk)</b>.</li>
          <li>Klik tombol <b>Terapkan (Deploy)</b> di bagian kanan atas → pilih <b>Penerapan Baru (New deployment)</b>.</li>
          <li>Klik icon gir (Select type) → pilih <b>Aplikasi web (Web app)</b>.</li>
          <li>Atur konfigurasi:
            <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-slate-500">
              <li><b>Description:</b> Kawal Madrasah v1</li>
              <li><b>Execute as:</b> Me (Email Google Anda)</li>
              <li><b>Who has access:</b> Anyone (Siapapun, agar server web bisa terhubung)</li>
            </ul>
          </li>
          <li>Klik <b>Terapkan (Deploy)</b>. Jika diminta otorisasi, klik <b>Authorize Access</b> dan pilih akun Google Anda, klik <i>Advanced</i> lalu klik <i>Go to ... (unsafe)</i> untuk melanjutkan perizinan pengiriman email.</li>
          <li>Salin <b>URL Aplikasi Web (Web App URL)</b> yang berakhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">/exec</code> lalu tempelkan ke panel Integrasi Google Sheet di tab Admin di bawah ini.</li>
        </ol>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full py-2.5 font-semibold text-sm rounded-lg border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700 animate-scale" />
                <span>Berhasil Disalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Kode Google Apps Script</span>
              </>
            )}
          </button>

          {showScript && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden animate-fade-in">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">code.js (Google Apps Script)</span>
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">JavaScript/GAS</span>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-250 font-mono text-xs max-h-80 overflow-y-auto leading-relaxed">
                <code>{appsScriptCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
