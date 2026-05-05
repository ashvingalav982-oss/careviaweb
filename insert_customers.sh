#!/bin/bash
sed -i '/{activeTab === '\''data'\'' && (/i \
            {activeTab === '\''customers'\'' && (\
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">\
                 <div className="mb-10">\
                   <div className="flex flex-col gap-2">\
                     <h3 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">\
                       <Users className="w-6 h-6 text-primary" /> Customer Database\
                     </h3>\
                     <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Live synchronized records of all registered users and their activity.</p>\
                   </div>\
                 </div>\
\
                 <div className="grid lg:grid-cols-2 gap-8 mb-10">\
                   <div className="glass-card p-8 border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center">\
                     <Database className="w-12 h-12 text-primary mb-4" />\
                     <h4 className="text-lg font-bold uppercase tracking-tight mb-2">Customers Master Sheet</h4>\
                     <p className="text-[10px] text-white/60 uppercase tracking-widest mb-6">Automatically synced with latest registrations, packages, and coupon codes.</p>\
                     <a \
                       href="https://docs.google.com/spreadsheets/d/mock-customers-sheet-id/edit" \
                       target="_blank" \
                       rel="noopener noreferrer"\
                       className="bg-primary text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"\
                     >\
                       <FileSpreadsheet className="w-4 h-4" /> Open Google Sheet\
                     </a>\
                   </div>\
\
                   <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center">\
                     <BriefcaseMedical className="w-12 h-12 text-amber-500 mb-4" />\
                     <h4 className="text-lg font-bold uppercase tracking-tight mb-2">Service Providers Sheet</h4>\
                     <p className="text-[10px] text-white/60 uppercase tracking-widest mb-6">Automatically synced with newly verified providers and application data.</p>\
                     <a \
                       href="https://docs.google.com/spreadsheets/d/mock-sp-sheet-id/edit" \
                       target="_blank" \
                       rel="noopener noreferrer"\
                       className="bg-amber-500 text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-500/90 transition-colors flex items-center gap-2"\
                     >\
                       <FileSpreadsheet className="w-4 h-4" /> Open Google Sheet\
                     </a>\
                   </div>\
                 </div>\
\
                 <div className="glass-card border-white/5 overflow-hidden">\
                   <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">\
                     <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">\
                       <Star className="w-4 h-4 text-amber-500" /> Premium Members\
                     </h4>\
                     <span className="text-[10px] text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest font-bold">Auto-Synced</span>\
                   </div>\
                   <div className="p-6">\
                     <table className="w-full text-left text-sm">\
                       <thead>\
                         <tr className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">\
                           <th className="pb-4 font-normal">Name</th>\
                           <th className="pb-4 font-normal">Address</th>\
                           <th className="pb-4 font-normal">Service / Package</th>\
                           <th className="pb-4 font-normal">Coupon</th>\
                         </tr>\
                       </thead>\
                       <tbody>\
                         <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">\
                           <td className="py-4 font-bold flex items-center gap-2"><Star className="w-3 h-3 text-amber-500" /> Ashvin G.</td>\
                           <td className="py-4 text-white/60">New Delhi, DL</td>\
                           <td className="py-4 text-primary">Elite Care Package</td>\
                           <td className="py-4 text-emerald-500">WELCOME50</td>\
                         </tr>\
                       </tbody>\
                     </table>\
                   </div>\
                 </div>\
\
                 <div className="glass-card border-white/5 overflow-hidden mt-6">\
                   <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">\
                     <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">\
                       <User className="w-4 h-4" /> Standard Members\
                     </h4>\
                     <span className="text-[10px] text-white/40 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest font-bold">Auto-Synced</span>\
                   </div>\
                   <div className="p-6">\
                     <table className="w-full text-left text-sm">\
                       <thead>\
                         <tr className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">\
                           <th className="pb-4 font-normal">Name</th>\
                           <th className="pb-4 font-normal">Address</th>\
                           <th className="pb-4 font-normal">Service / Package</th>\
                           <th className="pb-4 font-normal">Coupon</th>\
                         </tr>\
                       </thead>\
                       <tbody>\
                         <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">\
                           <td className="py-4 font-bold flex items-center gap-2"><User className="w-3 h-3 text-white/40" /> Guest User</td>\
                           <td className="py-4 text-white/60">Mumbai, MH</td>\
                           <td className="py-4 text-white/80">Basic Consult</td>\
                           <td className="py-4 text-white/40">None</td>\
                         </tr>\
                       </tbody>\
                     </table>\
                   </div>\
                 </div>\
              </div>\
            )}' src/App.tsx
