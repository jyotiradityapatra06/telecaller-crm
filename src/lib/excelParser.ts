import * as XLSX from 'xlsx';
import { ParsedLeadRow, BusinessBrand } from '../types';

export interface ParseResult {
  validRows: ParsedLeadRow[];
  invalidRows: ParsedLeadRow[];
  totalRows: number;
  fileName: string;
}

export function parseExcelOrCsv(file: File, targetBrand?: BusinessBrand): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      reject(new Error('Please choose an Excel (.xlsx, .xls) or CSV file.'));
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Could not read the uploaded file.');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded spreadsheet contains no sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('The spreadsheet is empty. Please check your file.');
        }

        const validRows: ParsedLeadRow[] = [];
        const invalidRows: ParsedLeadRow[] = [];

        rawJson.forEach((row, index) => {
          // Normalize keys to lowercase trimmed
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
            normalized[cleanKey] = String(row[key] || '').trim();
          });

          // Match flexible column aliases
          const name =
            normalized['name'] ||
            normalized['fullname'] ||
            normalized['customername'] ||
            normalized['leadname'] ||
            normalized['clientname'] ||
            normalized['contactname'] ||
            normalized['personname'] ||
            '';

          const rawPhone =
            normalized['phone'] ||
            normalized['mobile'] ||
            normalized['mobilenumber'] ||
            normalized['phonenumber'] ||
            normalized['contactnumber'] ||
            normalized['contactno'] ||
            normalized['tel'] ||
            normalized['cell'] ||
            '';

          const email =
            normalized['email'] ||
            normalized['emailaddress'] ||
            normalized['mail'] ||
            normalized['electronicmail'] ||
            undefined;

          const city =
            normalized['city'] ||
            normalized['location'] ||
            normalized['state'] ||
            normalized['region'] ||
            normalized['address'] ||
            undefined;

          const source =
            normalized['source'] ||
            normalized['campaign'] ||
            normalized['leadsource'] ||
            normalized['channel'] ||
            file.name.replace(/\.[^/.]+$/, '') ||
            'Excel Import';

          // Vidya fields
          const courseInterest =
            normalized['courseinterest'] ||
            normalized['course'] ||
            normalized['program'] ||
            normalized['subject'] ||
            undefined;

          const qualification =
            normalized['qualification'] ||
            normalized['degree'] ||
            normalized['education'] ||
            undefined;

          const preferredBatch =
            normalized['preferredbatch'] ||
            normalized['batch'] ||
            normalized['timing'] ||
            undefined;

          // Estate fields
          const propertyType =
            normalized['propertytype'] ||
            normalized['property'] ||
            normalized['flat'] ||
            normalized['bhk'] ||
            undefined;

          const preferredLocation =
            normalized['preferredlocation'] ||
            normalized['site'] ||
            normalized['area'] ||
            normalized['locality'] ||
            undefined;

          const siteVisitDate =
            normalized['sitevisitdate'] ||
            normalized['visitdate'] ||
            normalized['appointment'] ||
            undefined;

          const productInterest =
            normalized['productinterest'] ||
            normalized['product'] ||
            normalized['service'] ||
            normalized['project'] ||
            normalized['requirement'] ||
            normalized['interest'] ||
            courseInterest ||
            propertyType ||
            undefined;

          const budget =
            normalized['budget'] ||
            normalized['amount'] ||
            normalized['investment'] ||
            normalized['value'] ||
            normalized['price'] ||
            undefined;

          const notes =
            normalized['notes'] ||
            normalized['note'] ||
            normalized['remark'] ||
            normalized['comments'] ||
            normalized['description'] ||
            undefined;

          // Deduce Brand
          let brand: BusinessBrand = targetBrand || 'APNI_VIDYA';
          const explicitBrand = normalized['brand'] || normalized['business'] || normalized['company'];
          if (explicitBrand) {
            if (explicitBrand.toLowerCase().includes('estate') || explicitBrand.toLowerCase().includes('real')) {
              brand = 'APNI_ESTATE';
            } else if (explicitBrand.toLowerCase().includes('vidya') || explicitBrand.toLowerCase().includes('edu')) {
              brand = 'APNI_VIDYA';
            }
          } else if (!targetBrand) {
            if (propertyType || preferredLocation || (budget && budget.includes('Cr'))) {
              brand = 'APNI_ESTATE';
            }
          }

          // Format phone number cleanly
          const cleanPhoneDigits = rawPhone.replace(/[^\d+]/g, '');

          const parsedRow: ParsedLeadRow = {
            name: name.trim(),
            phone: cleanPhoneDigits || rawPhone.trim(),
            email: email?.trim(),
            city: city?.trim(),
            source: source?.trim(),
            brand,
            courseInterest: courseInterest?.trim(),
            qualification: qualification?.trim(),
            preferredBatch: preferredBatch?.trim(),
            propertyType: propertyType?.trim(),
            budget: budget?.trim(),
            preferredLocation: preferredLocation?.trim(),
            siteVisitDate: siteVisitDate?.trim(),
            productInterest: productInterest?.trim(),
            notes: notes?.trim(),
            isValid: true,
          };

          // Validate required fields: Name and Phone
          if (!parsedRow.name) {
            parsedRow.isValid = false;
            parsedRow.errorReason = `Row ${index + 2}: Missing contact Name.`;
            invalidRows.push(parsedRow);
          } else if (!parsedRow.phone || parsedRow.phone.replace(/[^\d]/g, '').length < 7) {
            parsedRow.isValid = false;
            parsedRow.errorReason = `Row ${index + 2}: Missing or invalid Phone number (${rawPhone || 'empty'}).`;
            invalidRows.push(parsedRow);
          } else {
            validRows.push(parsedRow);
          }
        });

        resolve({
          validRows,
          invalidRows,
          totalRows: rawJson.length,
          fileName: file.name,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file from storage.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleTemplate(brand: BusinessBrand = 'APNI_VIDYA'): void {
  const wb = XLSX.utils.book_new();
  const sampleData =
    brand === 'APNI_VIDYA'
      ? [
          {
            'Full Name': 'Aman Gupta',
            'Phone Number': '+91 98765 43210',
            'Email': 'aman.gupta@example.com',
            'City': 'New Delhi',
            'Course Interest': 'Full Stack Web Development',
            'Qualification': 'Graduate (B.Tech)',
            'Preferred Batch': 'Weekday Morning (8-10 AM)',
            'Lead Source': 'Website Inquiry',
          },
          {
            'Full Name': 'Sneha Nair',
            'Phone Number': '+91 97112 33445',
            'Email': 'sneha.nair@example.com',
            'City': 'Bengaluru',
            'Course Interest': 'Data Science & Generative AI',
            'Qualification': 'Working Professional',
            'Preferred Batch': 'Weekend Intensive (Sat-Sun)',
            'Lead Source': 'Google Ads',
          },
        ]
      : [
          {
            'Full Name': 'Vikram Mehra',
            'Phone Number': '+91 99887 76655',
            'Email': 'vikram.mehra@example.com',
            'City': 'Gurugram',
            'Property Type': '3 BHK Luxury High-rise',
            'Budget': '₹1.8 Cr - ₹2.5 Cr',
            'Preferred Location': 'Golf Course Extension Road',
            'Lead Source': 'Property Portal',
          },
          {
            'Full Name': 'Anjali Deshmukh',
            'Phone Number': '+91 98220 11223',
            'Email': 'anjali.d@example.com',
            'City': 'Pune',
            'Property Type': '4 BHK Gated Villa',
            'Budget': '₹3.2 Cr - ₹4.0 Cr',
            'Preferred Location': 'Baner / Balewadi',
            'Lead Source': 'Direct Walk-in',
          },
        ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, brand === 'APNI_VIDYA' ? 'VidyaLeads' : 'EstateLeads');
  XLSX.writeFile(wb, `TeleCaller_Sample_${brand}.xlsx`);
}
