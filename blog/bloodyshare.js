/* BLOODYCAPELLA SHARE MODULE v1.0
   Módulo independiente para bloodyquiz.js v2.1
   Exporta tarjetas PNG, comparte archivos/enlaces y copia resultados.
*/
(() => {
  "use strict";

  const ROOT_ID = "bc-quiz";
  const MODULE_ID = "bc-share-module";
  const root = document.getElementById(ROOT_ID);
  if (!root || root.dataset.bcShareReady === "1") return;
  root.dataset.bcShareReady = "1";

  const $ = id => root.querySelector("#" + id);
  const safeText = element => (element?.textContent || "").trim();
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const style = document.createElement("style");
  style.textContent = `
    #${MODULE_ID}{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(5,5,8,.86);backdrop-filter:blur(9px);font-family:Arial,sans-serif;color:#eadbd0}
    #${MODULE_ID}.is-open{display:flex}
    #${MODULE_ID} *{box-sizing:border-box}
    #${MODULE_ID} .bcs-dialog{width:min(680px,100%);max-height:92vh;overflow:auto;background:linear-gradient(145deg,#1c151a,#09090c 75%);border:1px solid #76505a;box-shadow:0 0 55px #000,0 0 35px #642c39;padding:22px;position:relative}
    #${MODULE_ID} .bcs-dialog:before{content:"";position:absolute;inset:8px;border:1px solid rgba(185,154,105,.16);pointer-events:none}
    #${MODULE_ID} .bcs-head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #49343b;padding-bottom:14px;margin-bottom:16px;position:relative}
    #${MODULE_ID} .bcs-kicker{font:10px monospace;letter-spacing:2px;color:#c3a477}
    #${MODULE_ID} .bcs-close{border:1px solid #76505a;background:transparent;color:#eadbd0;padding:8px 11px;cursor:pointer}
    #${MODULE_ID} .bcs-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.8fr);gap:18px;position:relative}
    #${MODULE_ID} .bcs-preview{min-width:0;background:#0b090c;border:1px solid #49343b;padding:10px}
    #${MODULE_ID} canvas{display:block;width:100%;height:auto;background:#100d10}
    #${MODULE_ID} .bcs-controls{display:flex;flex-direction:column;gap:10px}
    #${MODULE_ID} .bcs-label{font:10px monospace;letter-spacing:1px;color:#bca99e;margin:5px 0 0}
    #${MODULE_ID} select,#${MODULE_ID} button{font:11px monospace;letter-spacing:1px}
    #${MODULE_ID} select{width:100%;padding:11px;background:#171116;color:#eadbd0;border:1px solid #76505a}
    #${MODULE_ID} .bcs-btn{width:100%;padding:12px 10px;border:1px solid #76505a;background:#21171c;color:#eadbd0;cursor:pointer;transition:.2s}
    #${MODULE_ID} .bcs-btn:hover{background:#4d2632;border-color:#c17b7e}
    #${MODULE_ID} .bcs-primary{background:linear-gradient(110deg,#642c39,#a13c4b);border-color:#b36a70}
    #${MODULE_ID} .bcs-note{font:10px/1.6 monospace;color:#9d8e8b;margin-top:5px}
    #${MODULE_ID} .bcs-status{min-height:28px;color:#d6b17c;font:10px/1.5 monospace}
    @media(max-width:560px){#${MODULE_ID}{padding:8px}#${MODULE_ID} .bcs-dialog{padding:16px}#${MODULE_ID} .bcs-layout{grid-template-columns:1fr}#${MODULE_ID} .bcs-preview{max-width:330px;margin:auto;width:100%}#${MODULE_ID} .bcs-controls{display:grid;grid-template-columns:1fr 1fr}#${MODULE_ID} .bcs-controls .bcs-label,#${MODULE_ID} .bcs-controls select,#${MODULE_ID} .bcs-controls .bcs-note,#${MODULE_ID} .bcs-controls .bcs-status{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = MODULE_ID;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Exportar resultado de BloodyCapella");
  modal.innerHTML = `
    <div class="bcs-dialog">
      <div class="bcs-head">
        <div>
          <div class="bcs-kicker">THE KINGDOM OF DU VIRI</div>
          <div style="font:20px Georgia,serif;margin-top:5px">FATE CARD // EXPORT</div>
        </div>
        <button type="button" class="bcs-close" data-bcs="close" aria-label="Cerrar">✕</button>
      </div>
      <div class="bcs-layout">
        <div class="bcs-preview"><canvas width="900" height="1200" aria-label="Vista previa de tarjeta"></canvas></div>
        <div class="bcs-controls">
          <div class="bcs-label">FORMATO DE EXPORTACIÓN</div>
          <select data-bcs="format">
            <option value="portrait">Retrato · 3:4</option>
            <option value="square">Cuadrado · 1:1</option>
            <option value="story">Historia · 9:16</option>
            <option value="landscape">Horizontal · 16:9</option>
          </select>
          <div class="bcs-label">ACCIONES</div>
          <button type="button" class="bcs-btn bcs-primary" data-bcs="download">↓ DESCARGAR PNG</button>
          <button type="button" class="bcs-btn" data-bcs="share">↗ COMPARTIR IMAGEN</button>
          <button type="button" class="bcs-btn" data-bcs="copy">▣ COPIAR TEXTO + LINK</button>
          <button type="button" class="bcs-btn" data-bcs="link">⌁ COPIAR LINK DEL BLOG</button>
          <div class="bcs-status" data-bcs="status" aria-live="polite"></div>
          <div class="bcs-note">La opción de compartir imagen depende del navegador y del dispositivo. Si no está disponible, descarga el PNG y publícalo manualmente.</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const canvas = modal.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const formatSelect = modal.querySelector('[data-bcs="format"]');
  const status = modal.querySelector('[data-bcs="status"]');

  const formats = {
    portrait: [900, 1200],
    square: [1080, 1080],
    story: [900, 1600],
    landscape: [1600, 900]
  };

  let cardData = null;
  let imageObject = null;
  let imageAttempt = 0;

  function getCardData() {
    const name = safeText($("bc-result-name")) || "UNKNOWN";
    const tag = safeText($("bc-result-tag"));
    const description = safeText($("bc-result-description"));
    const traits = [...root.querySelectorAll("#bc-traits .bc-trait")]
      .map(item => safeText(item)).filter(Boolean);
    const imageElement = $("bc-result-image");
    const imageURL = imageElement && !imageElement.hidden ? imageElement.currentSrc || imageElement.src : "";
    const bars = [...root.querySelectorAll("#bc-bars .bc-score-row")].map(row => ({
      name: safeText(row.querySelector(".bc-score-label span")),
      score: safeText(row.querySelector(".bc-score-label strong"))
    })).filter(item => item.name);
    const secondary = safeText($("bc-second"));
    return {
      name, tag, description, traits, imageURL, bars, secondary,
      url: window.location.href.split("#")[0],
      blogTitle: document.title || "BloodyCapella"
    };
  }

  function roundedRect(context, x, y, w, h, r) {
    context.beginPath();
    context.roundRect(x, y, w, h, r);
  }

  function fitText(context, text, maxWidth, font) {
    context.font = font;
    let output = String(text || "");
    while (output.length > 3 && context.measureText(output).width > maxWidth) {
      output = output.slice(0, -2) + "…";
    }
    return output;
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let lines = 0;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (context.measureText(test).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        lines++;
        line = word;
        if (lines >= maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line && lines < maxLines) {
      if (lines === maxLines - 1 && words.length > 0) line = fitText(context, line, maxWidth, context.font);
      context.fillText(line, x, y);
    }
    return y + lineHeight;
  }

  function drawOrnament(context, w, h) {
    context.strokeStyle = "rgba(195,164,119,.45)";
    context.lineWidth = 2;
    context.strokeRect(28, 28, w - 56, h - 56);
    context.strokeStyle = "rgba(195,164,119,.2)";
    context.strokeRect(42, 42, w - 84, h - 84);
    const marks = [[55,55],[w-55,55],[55,h-55],[w-55,h-55]];
    marks.forEach(([x,y]) => {
      context.beginPath();
      context.moveTo(x-10,y); context.lineTo(x,y-10);
      context.lineTo(x+10,y); context.lineTo(x,y+10);
      context.closePath(); context.stroke();
    });
  }

  function drawImageCover(context, image, x, y, w, h) {
    const scale = Math.max(w / image.width, h / image.height);
    const sw = w / scale, sh = h / scale;
    const sx = (image.width - sw) / 2, sy = (image.height - sh) / 2;
    context.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  function loadPortrait(url) {
    imageObject = null;
    if (!url) return Promise.resolve(null);
    return new Promise(resolve => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => { imageObject = image; resolve(image); };
      image.onerror = () => { imageObject = null; resolve(null); };
      image.src = url;
    });
  }

  function renderCard() {
    if (!cardData) return;
    const [w, h] = formats[formatSelect.value] || formats.portrait;
    canvas.width = w;
    canvas.height = h;
    const c = ctx;
    c.clearRect(0, 0, w, h);

    const bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#24151c");
    bg.addColorStop(.48, "#100d12");
    bg.addColorStop(1, "#08090c");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    const glow = c.createRadialGradient(w*.5,h*.35,10,w*.5,h*.35,w*.7);
    glow.addColorStop(0,"rgba(131,59,72,.25)");
    glow.addColorStop(1,"rgba(10,8,12,0)");
    c.fillStyle = glow;
    c.fillRect(0,0,w,h);
    drawOrnament(c,w,h);

    const shortSide = Math.min(w,h);
    const scale = shortSide / 900;
    const center = w / 2;
    const margin = 95 * scale;
    const compact = h < w;

    c.textAlign = "center";
    c.fillStyle = "#c3a477";
    c.font = `bold ${Math.round(22*scale)}px monospace`;
    c.fillText("THE KINGDOM OF DU VIRI", center, 95*scale);
    c.fillStyle = "#927e7c";
    c.font = `${Math.round(15*scale)}px monospace`;
    c.fillText("BLOODYCAPELLA // PERSONALITY ARCHIVE", center, 127*scale);

    let y = 165*scale;
    const imageMaxW = compact ? w*.37 : w*.64;
    const imageH = compact ? h*.43 : h*.39;
    const imageW = Math.min(imageMaxW, imageH*.78);
    const imageX = center-imageW/2;

    c.save();
    c.shadowColor = "rgba(197,75,94,.35)";
    c.shadowBlur = 28*scale;
    c.fillStyle = "#171016";
    c.fillRect(imageX-5*scale,y-5*scale,imageW+10*scale,imageH+10*scale);
    c.restore();

    if (imageObject) {
      drawImageCover(c,imageObject,imageX,y,imageW,imageH);
    } else {
      const fallback = c.createLinearGradient(imageX,y,imageX+imageW,y+imageH);
      fallback.addColorStop(0,"#42232e");
      fallback.addColorStop(1,"#100d12");
      c.fillStyle=fallback;
      c.fillRect(imageX,y,imageW,imageH);
      c.fillStyle="#c3a477";
      c.font=`${Math.round(24*scale)}px Georgia`;
      c.fillText("✧",center,y+imageH*.52);
      c.fillStyle="#9f8584";
      c.font=`${Math.round(12*scale)}px monospace`;
      c.fillText("PORTRAIT UNAVAILABLE",center,y+imageH*.62);
    }
    c.strokeStyle="rgba(195,164,119,.75)";
    c.lineWidth=2*scale;
    c.strokeRect(imageX,y,imageW,imageH);
    y += imageH + 48*scale;

    c.fillStyle="#ead9c7";
    c.font=`bold ${Math.round(compact?36:48)*scale}px Georgia`;
    c.fillText(fitText(c,cardData.name,w-2*margin,c.font),center,y);
    y += 34*scale;

    c.fillStyle="#c3a477";
    c.font=`${Math.round(14*scale)}px monospace`;
    c.fillText(fitText(c,cardData.tag,w-2*margin,c.font),center,y);
    y += 35*scale;

    c.strokeStyle="rgba(195,164,119,.4)";
    c.beginPath();c.moveTo(margin,y);c.lineTo(w-margin,y);c.stroke();
    y += 28*scale;

    c.fillStyle="#d9c9bd";
    c.font=`${Math.round(17*scale)}px Georgia`;
    const maxDescLines = compact ? 2 : 4;
    y = wrapText(c,cardData.description,center,y,w-2*margin,24*scale,maxDescLines);
    y += 10*scale;

    if (cardData.traits.length) {
      c.fillStyle="#d5ad9f";
      c.font=`${Math.round(13*scale)}px monospace`;
      const traitText=cardData.traits.join("  ·  ");
      y=wrapText(c,traitText,center,y,w-2*margin,20*scale,2);
    }

    if (!compact && cardData.bars.length) {
      y += 20*scale;
      c.fillStyle="#c3a477";
      c.font=`${Math.round(13*scale)}px monospace`;
      c.fillText("THREADS OF FATE",center,y);
      y += 22*scale;
      const entries=cardData.bars.slice(0,5);
      const barW=w-2*margin;
      entries.forEach((entry,i)=>{
        const rowY=y+i*31*scale;
        c.textAlign="left";
        c.fillStyle="#cbb9ad";
        c.font=`${Math.round(12*scale)}px monospace`;
        c.fillText(fitText(c,entry.name,barW*.56,c.font),margin,rowY);
        c.textAlign="right";
        c.fillStyle="#c3a477";
        c.fillText(entry.score, w-margin,rowY);
        c.fillStyle="#30242a";
        c.fillRect(margin,rowY+7*scale,barW,4*scale);
        const match=entry.score.match(/(\d+(?:\.\d+)?)%/);
        const pct=match?Math.max(0,Math.min(100,Number(match[1]))):0;
        const fg=c.createLinearGradient(margin,0,w-margin,0);
        fg.addColorStop(0,"#743044");fg.addColorStop(1,"#d65a68");
        c.fillStyle=fg;
        c.fillRect(margin,rowY+7*scale,barW*pct/100,4*scale);
      });
      y += entries.length*31*scale;
    }

    c.textAlign="center";
    c.fillStyle="#a28d83";
    c.font=`${Math.round(12*scale)}px monospace`;
    const footerY=h-75*scale;
    c.fillText("A FRAGMENT OF YOUR IDENTITY HAS BEEN RECOVERED",center,footerY);
    c.fillStyle="#c3a477";
    c.font=`${Math.round(13*scale)}px monospace`;
    c.fillText("BLOODYCAPELLA // "+window.location.hostname,center,h-48*scale);
  }

  function getShareText() {
    if (!cardData) return "";
    return `✧ MY FATE HAS BEEN REVEALED ✧\n${cardData.name}\n${cardData.tag}\n${cardData.description}\n\nDiscover your identity in BloodyCapella Quiz Engine:\n${cardData.url}`;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function canvasBlob() {
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("No se pudo generar el PNG.")),"image/png");
    });
  }

  function filename() {
    const slug=(cardData?.name||"bloodycapella-result")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    return `bloodycapella-${slug||"result"}.png`;
  }

  async function downloadPNG() {
    try {
      const blob=await canvasBlob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=filename();
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      setStatus("PNG GENERADO. TARJETA DESCARGADA.");
    } catch(error) {
      setStatus(error.message||"No se pudo exportar la imagen.");
    }
  }

  async function shareCard() {
    try {
      const blob=await canvasBlob();
      const file=new File([blob],filename(),{type:"image/png"});
      const text=getShareText();
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({title:"BloodyCapella // "+cardData.name,text,url:cardData.url,files:[file]});
        setStatus("VENTANA DE COMPARTIR ABIERTA.");
      } else if(navigator.share) {
        await navigator.share({title:"BloodyCapella // "+cardData.name,text,url:cardData.url});
        setStatus("SE COMPARTIÓ EL ENLACE. DESCARGA EL PNG PARA ADJUNTAR LA IMAGEN.");
      } else {
        await downloadPNG();
        setStatus("ESTE NAVEGADOR NO ADMITE COMPARTIR ARCHIVOS. PNG DESCARGADO.");
      }
    } catch(error) {
      if(error.name!=="AbortError") setStatus("No se pudo compartir. Prueba descargar el PNG.");
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(getShareText());
      setStatus("TEXTO Y ENLACE COPIADOS.");
    } catch(error) {
      window.prompt("Copia tu resultado:",getShareText());
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cardData.url);
      setStatus("ENLACE DEL BLOG COPIADO.");
    } catch(error) {
      window.prompt("Copia el enlace:",cardData.url);
    }
  }

  async function open() {
    cardData=getCardData();
    if(!cardData.name || !$("bc-results") || $("bc-results").hidden){
      setStatus("Primero completa el cuestionario.");
      return;
    }
    setStatus("PREPARANDO TARJETA...");
    modal.classList.add("is-open");
    document.body.style.overflow="hidden";
    const currentAttempt=++imageAttempt;
    await loadPortrait(cardData.imageURL);
    if(currentAttempt!==imageAttempt)return;
    renderCard();
    setStatus(imageObject?"TARJETA LISTA PARA EXPORTAR.":"TARJETA LISTA. RETRATO NO DISPONIBLE PARA EXPORTACIÓN.");
  }

  function close() {
    modal.classList.remove("is-open");
    document.body.style.overflow="";
  }

  // Captura el botón existente antes de que bloodyquiz.js ejecute su antiguo shareResult().
  document.addEventListener("click",event=>{
    const shareButton=event.target.closest("#bc-share");
    if(!shareButton || !root.contains(shareButton))return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    open();
  },true);

  modal.addEventListener("click",event=>{
    const action=event.target.closest("[data-bcs]");
    if(!action){
      if(event.target===modal)close();
      return;
    }
    switch(action.dataset.bcs){
      case "close":close();break;
      case "download":downloadPNG();break;
      case "share":shareCard();break;
      case "copy":copyText();break;
      case "link":copyLink();break;
    }
  });

  formatSelect.addEventListener("change",renderCard);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&modal.classList.contains("is-open"))close();
  });

  // Se expone una API pequeña para integraciones futuras.
  root.BloodyCapellaShare={
    open,close,render:renderCard,
    getResult:getCardData
  };
})();
