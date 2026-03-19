"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { RiDownloadLine, RiCloseLine } from "react-icons/ri";

export default function PhotoViewer({ url, onClose }: { url: string; onClose: () => void }) {
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

  return createPortal(
    <div
      style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
      onClick={onClose}
    >
      <div style={{ position:"relative", maxWidth:"700px", width:"100%" }} onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="Factura"
          style={{ width:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:"16px", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}
        />
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginTop:"16px" }}>
          <a
            href={url}
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