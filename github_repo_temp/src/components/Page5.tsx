import React from 'react';

export default function Page5() {
  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">18.</span>
        <div className="space-y-4 w-full">
          <span className="block font-bold">I have drawn total emoluments from this college in the current financial year as under:</span>
          <div className="w-full flex justify-center">
            <table className="w-[80%] border-collapse border border-black text-[12px] mt-2 doc-table">
              <thead>
                <tr>
                  <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-1/3">Month<br/>/ Year</th>
                  <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-1/3">Amount Received</th>
                  <th className="border border-black p-2 font-bold text-center bg-transparent text-black normal-case w-1/3">TDS</th>
                </tr>
              </thead>
              <tbody>
                {['Jan/', 'Feb/', 'March/', 'April/', 'May/', 'June/', 'July /', 'August/', 'September/', 'October/', 'November/', 'December/'].map((month) => (
                  <tr key={month}>
                    <td className="border border-black p-0 h-[34px] align-middle">
                      <div className="flex items-center justify-center h-full">
                        <span className="w-20 pr-1 text-right">{month}</span>
                        <input type="text" className="w-12 bg-transparent focus:outline-none focus:bg-gray-100 text-[12px]" placeholder="YYYY" />
                      </div>
                    </td>
                    <td className="border border-black p-0 h-[34px] align-top">
                      <input type="text" className="w-full h-full p-2 text-right bg-transparent focus:outline-none focus:bg-gray-100 text-[12px] leading-tight" />
                    </td>
                    <td className="border border-black p-0 h-[34px] align-top">
                      <input type="text" className="w-full h-full p-2 text-right bg-transparent focus:outline-none focus:bg-gray-100 text-[12px] leading-tight" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">19.</span>
        <div className="space-y-2 w-full">
          <span className="block font-bold">Number of Research articles in Indexed Journals:</span>
          <div className="pl-[2rem] space-y-2">
            <div className="flex flex-wrap items-center gap-4">
               <span className="w-[280px]">a. International Journals:</span>
               <input type="number" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <span className="w-[280px]">b. National Journals:</span>
               <input type="number" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <span className="w-[280px]">c. State / Institutional Journals:</span>
               <input type="number" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold">20.</span>
        <div className="space-y-2 w-full">
          <span className="block font-bold">Details of other publications:</span>
          <div className="pl-[2rem] space-y-2">
            <div className="flex flex-wrap items-center gap-4">
               <span className="w-[280px]">a. Number of Books published:</span>
               <input type="number" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <span className="w-[280px]">b. Number of Chapters in books:</span>
               <input type="number" className="w-24 border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
