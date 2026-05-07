import React from 'react';

export interface Intern {
  name?: string;
  course?: string;
  school?: string;
  hours?: number;
  dateStarted?: string;
  dateCompleted?: string;
  gender?: string;
  department?: string;
}

interface CertificateTemplateProps {
  intern?: Intern | null;
  forwardRef?: React.Ref<HTMLDivElement>;
}

// 🔢 Helper Function: Converts numbers to words (e.g., 600 -> "Six Hundred")
const numberToWords = (num?: number): string => {
  if (!num || num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  
  let words = '';
  if (num >= 1000) {
    words += a[Math.floor(num / 1000)] + ' Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    words += a[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      words += a[num];
    } else {
      words += b[Math.floor(num / 10)];
      if (num % 10 > 0) words += '-' + a[num % 10];
    }
  }
  return words.trim();
};

// 📅 Helper Function: Gets 1st, 2nd, 3rd, 4th, etc.
const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const CertificateTemplate = ({ intern, forwardRef }: CertificateTemplateProps) => {
  const today = new Date();
  const dayOrdinal = getOrdinal(today.getDate());
  const month = today.toLocaleDateString('en-US', { month: 'long' });
  const year = today.getFullYear();

  // Handle pronouns safely
  const pronoun1 = intern?.gender === 'female' ? 'her' : 'his';
  const pronoun2 = intern?.gender === 'female' ? 'she' : 'he';
  const pronoun3 = intern?.gender === 'female' ? 'her' : 'him';

  return (
    <div 
      ref={forwardRef}
      className="relative w-[1123px] h-[794px] bg-[url('/Certificate.png')] bg-cover bg-center font-sans text-gray-900"
    >
      {/* 📝 THE DYNAMIC CONTENT */}
      <div className="absolute top-[220px] left-[80px] w-[963px] z-[2] text-[22px] leading-[1.7]">
        
        {/* Paragraph 1 */}
        <p className="text-justify indent-[50px] mb-[35px]">
          This is to certify that <span className="font-bold">{intern?.name || 'INTERN NAME'}</span> , a {intern?.course || 'course'} student of {intern?.school || 'school'} has accomplished {pronoun1} Internship with a total of {numberToWords(intern?.hours)} ({intern?.hours || 0}) hours from {intern?.dateStarted || 'Start Date'} to {intern?.dateCompleted || 'End Date'}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify indent-[50px] mb-[35px]">
          This is to certify further that {pronoun2} was exposed to the real insurance environment, observance of safety practices and familiarization with the job and skills toward {intern?.department || 'their department'}.
        </p>

        {/* Paragraph 3 */}
        <p className="text-center mb-[45px]">
          This certification is issued upon the request of the above-named student for whatever purpose it may serve {pronoun3} best.
        </p>

        {/* Date Paragraph */}
        <p className="text-center">
          Done this {dayOrdinal} of {month} {year} in the City of Cagayan de Oro, Philippines.
        </p>

      </div>
    </div>
  );
};

export default CertificateTemplate;