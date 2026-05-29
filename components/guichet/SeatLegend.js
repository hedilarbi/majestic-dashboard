import { RiArmchairFill, RiArmchairLine } from "react-icons/ri";

export default function SeatLegend() {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-5 bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <RiArmchairLine className="h-5 w-5 text-slate-200" />
        Disponible
      </div>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
        <RiArmchairFill className="h-5 w-5 text-primary" />
        Sélectionné
      </div>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-violet-600">
        <RiArmchairFill className="h-5 w-5 text-violet-500" />
        Réservé
      </div>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-rose-500">
        <RiArmchairFill className="h-5 w-5 text-rose-400" />
        Occupé
      </div>
    </div>
  );
}
