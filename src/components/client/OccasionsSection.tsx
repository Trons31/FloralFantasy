"use client";

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
  RiTimeLine,
} from "react-icons/ri";
import { BsFillCake2Fill } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

type Occasion = {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  advanceOrderDays: number;
  images: { url: string; isMain: boolean; order: number }[];
};

function getVisual(slug: string, index: number) {
  const visuals = [
    { slug: "amor", icon: RiHeartLine, bg: "bg-rose-900" },
    { slug: "cumpleanos", icon: BsFillCake2Fill, bg: "bg-amber-900" },
    { slug: "bodas", icon: RiVipCrownLine, bg: "bg-purple-900" },
    { slug: "condolencias", icon: RiUserHeartLine, bg: "bg-blue-900" },
    { slug: "graduacion", icon: RiMedalLine, bg: "bg-emerald-900" },
    { slug: "recuperacion", icon: RiHospitalLine, bg: "bg-teal-900" },
    { slug: "de-autor", icon: RiFlowerLine, bg: "bg-fuchsia-900" },
    { slug: "de-tulipan", icon: RiLeafLine, bg: "bg-pink-900" },
    { slug: "de-bienvenida", icon: RiDoorOpenLine, bg: "bg-lime-900" },
  ];

  return visuals.find((item) => item.slug === slug) || visuals[index % visuals.length];
}

export default function OccasionsSection({ occasions }: { occasions: Occasion[] }) {
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

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 0, disableOnInteraction: false }}
          speed={8000}
          loop
          grabCursor
          slidesPerView="auto"
          spaceBetween={12}
          className="!px-4 sm:!px-6"
          style={{ paddingBottom: "8px" }}
        >
          {occasions.map((occasion, index) => {
            const visual = getVisual(occasion.slug, index);
            const mainImage =
              occasion.images.find((image) => image.isMain)?.url ||
              occasion.images.slice().sort((a, b) => a.order - b.order)[0]?.url;

            return (
              <SwiperSlide key={occasion.id} style={{ width: "180px" }}>
                <Link href={`/flores?ocasion=${occasion.slug}`} className="group block">
                  <div
                    className={`relative rounded-2xl overflow-hidden ${visual.bg}`}
                    style={{ aspectRatio: "3/4" }}
                  >
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={occasion.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-4 pb-5 text-center">
                      {occasion.advanceOrderDays > 0 && (
                        <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                          <RiTimeLine size={11} />
                          {occasion.advanceOrderDays} días antes
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2 border border-white/20 group-hover:bg-primary-600/80 transition-colors">
                        <visual.icon className="text-white" size={18} />
                      </div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {occasion.name}
                      </p>
                      <p className="text-white/60 text-[10px] mt-0.5">
                        {occasion.subtitle || "Arreglo especial"}
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </motion.div>
    </section>
  );
}

