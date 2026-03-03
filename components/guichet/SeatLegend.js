import { RiArmchairFill, RiArmchairLine } from "react-icons/ri";

export default function SeatLegend() {
  return (
    <div className="mt-14 flex flex-wrap justify-center gap-6 bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <RiArmchairLine className="h-5 w-5 text-slate-300" />
        Disponible
      </div>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
        <RiArmchairFill className="h-5 w-5 text-primary" />
        Sélectionné
      </div>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <RiArmchairFill className="h-5 w-5 text-slate-300" />
        Occupé
      </div>
    </div>
  );
}
