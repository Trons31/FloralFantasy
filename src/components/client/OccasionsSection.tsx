"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RiHeartLine , RiVipCrownLine,
  RiUserHeartLine, RiMedalLine, RiHospitalLine,
} from "react-icons/ri";

import { BsFillCake2Fill } from "react-icons/bs";

const occasions = [
  { Icon: RiHeartLine,        label: "Amor & Romance",  slug: "amor",         color: "bg-rose-50   border-rose-200   hover:bg-rose-100",   iconColor: "text-rose-500"   },
  { Icon: BsFillCake2Fill, label: "Cumpleaños",      slug: "cumpleanos",   color: "bg-amber-50  border-amber-200  hover:bg-amber-100",  iconColor: "text-amber-500"  },
  { Icon: RiVipCrownLine,     label: "Bodas",           slug: "bodas",        color: "bg-purple-50 border-purple-200 hover:bg-purple-100", iconColor: "text-purple-500" },
  { Icon: RiUserHeartLine,    label: "Condolencias",    slug: "condolencias", color: "bg-blue-50   border-blue-200   hover:bg-blue-100",   iconColor: "text-blue-500"   },
  { Icon: RiMedalLine,        label: "Graduación",      slug: "graduacion",   color: "bg-green-50  border-green-200  hover:bg-green-100",  iconColor: "text-green-500"  },
  { Icon: RiHospitalLine,     label: "Recuperación",    slug: "recuperacion", color: "bg-teal-50   border-teal-200   hover:bg-teal-100",   iconColor: "text-teal-500"   },
];

export default function OccasionsSection() {
  return (
    <section className="py-24 bg-[#fdfcf8] petal-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="text-4xl md:text-5xl font-display font-semibold"
            style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
            Para cada ocasión
          </motion.h2>
          <p className="text-gray-500 mt-3">Flores perfectas para cada momento de vida</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {occasions.map((o, i) => (
            <motion.div key={o.slug} initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*0.08}}>
              <Link href={`/flores?ocasion=${o.slug}`}>
                <div className={`border-2 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${o.color}`}>
                  <div className={`flex items-center justify-center mb-3 ${o.iconColor}`}>
                    <o.Icon size={36}/>
                  </div>
                  <h3 className="font-semibold text-gray-800">{o.label}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}