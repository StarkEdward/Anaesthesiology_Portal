import React from 'react';

export default function Page6() {
  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4">
        <span className="w-6 text-right font-bold w-[max-content]">21.</span>
        <div className="space-y-2 w-full">
          <span className="block font-bold">Any other information/ achievements/ patents:</span>
          <div className="pt-2 space-y-6">
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4 mt-8">
        <span className="w-6 text-right font-bold w-[max-content]">22.</span>
        <div className="space-y-4 w-full">
          <span className="block font-bold">Oral presentations:</span>
          <div className="pl-6 space-y-4">
            <div className="flex items-end gap-4">
               <span className="w-48 whitespace-nowrap">in zonal conference:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end gap-4">
               <span className="w-48 whitespace-nowrap">State conference:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end gap-4">
               <span className="w-48 whitespace-nowrap">National conference:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
            <div className="flex items-end gap-4">
               <span className="w-48 whitespace-nowrap">International conference:</span>
               <input type="text" className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4 mt-8">
        <span className="w-6 text-right font-bold w-[max-content]">23.</span>
        <div className="space-y-2 w-full">
          <span className="block font-bold">Poster presentations: in zonal/ State/ National/ International Conference.</span>
          <div className="pt-2 space-y-6">
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 items-start pb-4 mt-8">
        <span className="w-6 text-right font-bold w-[max-content]">24.</span>
        <div className="space-y-2 w-full">
          <span className="block font-bold">Awards/ prizes:</span>
          <div className="pt-2 space-y-6">
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
             <input type="text" className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-gray-100" />
          </div>
        </div>
      </div>

    </div>
  );
}
