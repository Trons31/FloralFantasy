"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RiDownloadLine, RiCloseLine, RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";

export default function PhotoViewer({
  url,
  urls,
  startIndex = 0,
  onClose,
}: {
  url?: string;
  urls?: string[];
  startIndex?: number;
  onClose: () => void;
}) {
  const imageUrls = useMemo(() => {
    const list = urls?.filter(Boolean) ?? (url ? [url] : []);
    return list.length > 0 ? list : [url || ""];
  }, [url, urls]);
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(0, imageUrls.length - 1)));

  // Lock body scroll and close on Escape
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const currentUrl = imageUrls[index] || imageUrls[0];

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
      onClick={onClose}
    >
      <div style={{ position:"relative", maxWidth:"700px", width:"100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"relative" }}>
          <img
            src={currentUrl}
            alt="Factura"
            style={{ width:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:"16px", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}
          />
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={() => setIndex((value) => (value - 1 + imageUrls.length) % imageUrls.length)}
                style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.12)", color:"white", border:"none", width:"42px", height:"42px", borderRadius:"999px", display:"flex", alignItems:"center", justifyContent:"center" }}
              >
                <RiArrowLeftLine size={18} />
              </button>
              <button
                onClick={() => setIndex((value) => (value + 1) % imageUrls.length)}
                style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.12)", color:"white", border:"none", width:"42px", height:"42px", borderRadius:"999px", display:"flex", alignItems:"center", justifyContent:"center" }}
              >
                <RiArrowRightLine size={18} />
              </button>
              <div style={{ position:"absolute", left:"50%", bottom:"12px", transform:"translateX(-50%)", background:"rgba(0,0,0,0.55)", color:"white", borderRadius:"999px", padding:"6px 10px", fontSize:"12px", fontWeight:600 }}>
                {index + 1} / {imageUrls.length}
              </div>
            </>
          )}
        </div>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginTop:"16px" }}>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", gap:"8px", background:"white", color:"#111", padding:"10px 20px", borderRadius:"12px", fontSize:"14px", fontWeight:600, textDecoration:"none" }}
          >
            <RiDownloadLine size={16}/> Descargar
          </a>
          <button
            onClick={onClose}
            style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.15)", color:"white", padding:"10px 20px", borderRadius:"12px", fontSize:"14px", fontWeight:600, border:"none", cursor:"pointer" }}
          >
            <RiCloseLine size={16}/> Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
