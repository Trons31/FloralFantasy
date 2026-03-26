"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RiHeartLine,
  RiVipCrownLine,
  RiUserHeartLine,
  RiMedalLine,
  RiHospitalLine,
  RiFlowerLine,
  RiLeafLine,
  RiDoorOpenLine,
} from "react-icons/ri";
import { BsFillCake2Fill } from "react-icons/bs";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";

const occasions = [
  {
    Icon: RiHeartLine,
    label: "Amor",
    sublabel: "& Romance",
    slug: "amor",
    bg: "bg-rose-900",
    img: "/flowers/ramo1.jpg",
  },
  {
    Icon: BsFillCake2Fill,
    label: "Cumpleaños",
    sublabel: "Celebra",
    slug: "cumpleanos",
    bg: "bg-amber-900",
    img: "/flowers/ramo2.jpg",
  },
  {
    Icon: RiVipCrownLine,
    label: "Bodas",
    sublabel: "& Eventos",
    slug: "bodas",
    bg: "bg-purple-900",
    img: "/flowers/ramo3.jpg",
  },
  {
    Icon: RiUserHeartLine,
    label: "Condolencias",
    sublabel: "Con amor",
    slug: "condolencias",
    bg: "bg-blue-900",
    img: "/flowers/ramo4.jpg",
  },
  {
    Icon: RiMedalLine,
    label: "Graduación",
    sublabel: "Felicitaciones",
    slug: "graduacion",
    bg: "bg-emerald-900",
    img: "/flowers/ramo1.jpg",
  },
  {
    Icon: RiHospitalLine,
    label: "Recuperación",
    sublabel: "Pronto mejor",
    slug: "recuperacion",
    bg: "bg-teal-900",
    img: "/flowers/ramo2.jpg",
  },
  // ── Tres nuevas ocasiones ──
  {
    Icon: RiFlowerLine,
    label: "De Autor",
    sublabel: "Diseño único",
    slug: "de-autor",
    bg: "bg-fuchsia-900",
    img: "/flowers/ramo3.jpg",
  },
  {
    Icon: RiLeafLine,
    label: "De Tulipán",
    sublabel: "Elegancia floral",
    slug: "de-tulipan",
    bg: "bg-pink-900",
    img: "/flowers/ramo4.jpg",
  },
  {
    Icon: RiDoorOpenLine,
    label: "De Bienvenida",
    sublabel: "Con cariño",
    slug: "de-bienvenida",
    bg: "bg-lime-900",
    img: "/flowers/ramo1.jpg",
  },
];

export default function OccasionsSection() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
            Encuentra el arreglo ideal
          </p>
          <h2
            className="font-display font-semibold text-gray-900"
            style={{
              fontFamily: "var(--font-cormorant),Georgia,serif",
              fontSize: "clamp(2rem,4vw,3rem)",
            }}
          >
            Para cada ocasión
          </h2>
        </motion.div>
      </div>

      {/* Carrusel Swiper — ocupa todo el ancho */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 0,           // sin pausa entre slides
            disableOnInteraction: false,
          }}
          speed={8000}          // transición lenta y suave
          loop={true}
          grabCursor={true}
          slidesPerView="auto"  // cada slide define su propio ancho
          spaceBetween={12}
          className="!px-4 sm:!px-6"
          style={{ paddingBottom: "8px" }}
        >
          {occasions.map((o, i) => (
            <SwiperSlide
              key={o.slug}
              style={{ width: "180px" }}   // ancho fijo por card
            >
              <Link href={`/flores?ocasion=${o.slug}`} className="group block">
                <div
                  className={`relative rounded-2xl overflow-hidden ${o.bg}`}
                  style={{ aspectRatio: "3/4" }}
                >
                  <img
                    src={o.img}
                    alt={o.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 pb-5 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2 border border-white/20 group-hover:bg-primary-600/80 transition-colors">
                      <o.Icon className="text-white" size={18} />
                    </div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {o.label}
                    </p>
                    <p className="text-white/60 text-[10px] mt-0.5">
                      {o.sublabel}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </section>
  );
}