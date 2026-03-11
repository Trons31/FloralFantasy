"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RiArrowRightLine, RiStarFill, RiTruckLine, RiShieldCheckLine,
  RiFlowerLine, RiHeartLine, RiVipCrownLine,
  RiUserHeartLine, RiLeafLine, RiSunLine,
} from "react-icons/ri";
import { BsFillCake2Fill } from "react-icons/bs";

const tags = [
  { label: "Amor",          Icon: RiHeartLine,        href: "amor"        },
  { label: "Cumpleaños",    Icon: BsFillCake2Fill  ,  href: "Cumpleanos"  },
  { label: "Bodas",         Icon: RiVipCrownLine,      href: "Bodas"       },
  { label: "Condolencias",  Icon: RiUserHeartLine,     href: "Condolencias"},
  { label: "Rosas",         Icon: RiFlowerLine,        href: "Rosas"       },
  { label: "Girasoles",     Icon: RiSunLine,           href: "Girasoles"   },
];

const cols = [
  {
    imgs: [{ src: "/flowers/ramo1.jpg", flex: 3 }, { src: "/flowers/ramo3.jpg", flex: 2 }],
    mt: "mt-0", delays: [0.3, 0.4],
  },
  {
    imgs: [{ src: "/flowers/ramo2.jpg", flex: 2 }, { src: "/flowers/ramo4.jpg", flex: 3 }],
    mt: "mt-10", delays: [0.5, 0.6],
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden petal-bg">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-100 rounded-full opacity-40 blur-3xl"/>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-rose-100 rounded-full opacity-30 blur-3xl"/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div className="z-10">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
              className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 mb-6">
              <RiFlowerLine className="text-primary-500" size={15}/>
              <span className="text-sm text-primary-700 font-medium">Flores frescas · Entrega a domicilio</span>
            </motion.div>

            <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="text-5xl md:text-7xl font-display font-semibold leading-[1.1] mb-6"
              style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
              Flores que{" "}
              <span className="text-gradient italic">hablan</span>
              {" "}por ti
            </motion.h1>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
              className="text-lg text-gray-500 mb-8 max-w-md font-light leading-relaxed">
              Arreglos florales únicos, diseñados con amor y entregados con el cuidado que mereces.
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
              className="flex flex-wrap gap-4 mb-10">
              <Link href="/flores"
                className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-full font-medium hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-200 hover:-translate-y-0.5">
                Ver catálogo <RiArrowRightLine size={18}/>
              </Link>
              <Link href="/seguimiento"
                className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full font-medium hover:border-primary-300 transition-all hover:-translate-y-0.5">
                Rastrear pedido
              </Link>
            </motion.div>

            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
              className="flex flex-wrap gap-5">
              {[
                { icon: RiStarFill,        text: "+500 clientes felices", color: "text-yellow-400" },
                { icon: RiTruckLine,       text: "Entrega el mismo día",  color: "text-primary-500" },
                { icon: RiShieldCheckLine, text: "Pago 100% seguro",      color: "text-green-500"   },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 text-sm text-gray-500">
                  <b.icon className={b.color} size={15}/> {b.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — staggered image collage */}
          <motion.div
            initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
            transition={{delay:0.3, duration:0.6}}
            className="hidden lg:flex gap-4 z-10 h-[520px]"
          >
            {cols.map((col, ci) => (
              <div key={ci} className={`flex flex-col gap-4 flex-1 ${col.mt}`}>
                {col.imgs.map((img, ii) => (
                  <motion.div key={ii}
                    initial={{opacity:0, y:24}} animate={{opacity:1, y:0}}
                    transition={{delay: col.delays[ii], duration: 0.6}}
                    style={{flex: img.flex}}
                    className="rounded-3xl overflow-hidden shadow-xl min-h-0"
                  >
                    <img src={img.src} alt="Flores" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"/>
                  </motion.div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Tags — react-icons */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.8}}
          className="mt-14 flex flex-wrap gap-3 items-center">
          <span className="text-sm text-gray-400">Popular:</span>
          {tags.map(({ label, Icon, href }) => (
            <Link key={label} href={`/flores?q=${href}`}
              className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-primary-300 hover:text-primary-600 transition-all hover:-translate-y-0.5 shadow-sm">
              <Icon size={13} className="text-primary-400"/>
              {label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}