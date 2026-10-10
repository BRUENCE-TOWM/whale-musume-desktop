import React from 'react';
import {createRoot} from 'react-dom/client';
import * as jsxRuntime from 'react/jsx-runtime';
import {ClickMusic} from './music.cjs';

const pref=(key, fallback)=>localStorage.getItem('desktop:'+key) ?? fallback;
const save=(key,value)=>localStorage.setItem('desktop:'+key,String(value));
const audio = new Audio(); audio.preload='metadata';
let musicError='', tracks=[], selected=pref('song',''), panelOpen=false, settingsComponent=null;
const music=new ClickMusic(audio, text=>{musicError=text; render();});
music.configure({enabled:pref('music','1')==='1',volume:Number(pref('volume','0.4'))});
window.addEventListener('whale-desktop-click',()=>music.toggle());
function notifyPrefs() { window.dispatchEvent(new CustomEvent('whale-moe-prefs-change')); }
localStorage.setItem('whale-moe:mode','float');
for(const key of ['mimoTts','keywords','balance','balanceDetail','a11y']) if(localStorage.getItem('whale-moe:'+key)===null) localStorage.setItem('whale-moe:'+key,'0');
async function refreshSongs() {
  tracks=await desktop.songs();
  if(!tracks.some(t=>t.name===selected)) selected=tracks[0]?.name || '';
  const track=tracks.find(t=>t.name===selected);
  if(track && audio.src!==track.url) music.select(track.url);
  if(!track) music.select('');
  save('song',selected); render();
}
const settingsRoot=createRoot(document.getElementById('settings-root'));
function openSettings() { panelOpen=true; desktop.focus(); refreshSongs(); render(); }
function closeSettings() { panelOpen=false; render(); }
function render() { settingsRoot.render(panelOpen ? <Settings/> : null); }
function Settings() {
  const [,tick]=React.useState(0);
  const redraw=()=>tick(n=>n+1);
  const update=(key,value)=>{save(key,value); music.configure({enabled:pref('music','1')==='1',volume:Number(pref('volume','0.4'))});redraw();};
  return <main className="desktop-panel"><header className="desktop-head"><div><h1>鲸鱼娘 · 桌面大肥鱼</h1><small>音乐陪伴 / 互动养成 / 本地保存</small></div><button onClick={closeSettings} aria-label="关闭设置">关闭 ✕</button></header>
    <section className="desktop-card"><h2>♫ 点击播放音乐</h2>
      <label className="desktop-row"><span>点击鲸鱼娘播放 / 暂停</span><input aria-label="点击音乐开关" type="checkbox" checked={pref('music','1')==='1'} onChange={e=>update('music',e.target.checked?'1':'0')}/></label>
      <label className="desktop-row"><span>歌曲</span><select aria-label="歌曲" value={selected} onChange={e=>{selected=e.target.value;save('song',selected);musicError='';music.select(tracks.find(t=>t.name===selected)?.url);redraw();}}>{tracks.length?tracks.map(t=><option key={t.name} value={t.name}>{t.name}</option>):<option value="">文件夹内没有歌曲</option>}</select></label>
      <label className="desktop-row"><span>音量 {Math.round(Number(pref('volume','0.4'))*100)}%</span><input aria-label="音乐音量" type="range" min="0" max="1" step="0.01" value={pref('volume','0.4')} onChange={e=>update('volume',e.target.value)}/></label>
      <div className="desktop-actions"><button onClick={()=>refreshSongs()}>刷新歌曲</button><button onClick={()=>music.pause()}>立即暂停</button></div>
      <p className="desktop-tip">点一下播放，再点暂停，再点继续；播完一遍自动停止，之后再点从头播放。鼠标移入移出和拖动不会改变播放状态。把新歌曲放进“桌面大肥鱼”文件夹后，点“刷新歌曲”。</p>
      {musicError && <p className="desktop-error">{musicError}</p>}
    </section>
    <section className="desktop-card"><h2>桌面显示</h2><label className="desktop-row"><span>大小 {pref('size','240')} px</span><input aria-label="桌宠大小" type="range" min="120" max="360" step="10" value={pref('size','240')} onChange={e=>{save('size',e.target.value);notifyPrefs();redraw();}}/></label>
      <div className="desktop-actions"><button onClick={reset}>回到右下角</button><button onClick={()=>desktop.hide()}>暂时隐藏</button><button onClick={()=>desktop.quit()}>退出桌宠</button></div>
      <p className="desktop-tip">左键摸头、戳肚子或尾巴；按住拖动；右键投喂、夸夸、玩小游戏。托盘图标可以唤回桌宠或切换显示器。</p>
    </section>
    {settingsComponent && React.createElement(settingsComponent,{})}
    <p className="desktop-tip">基于 Sutera-Diffusus/dsh-whale-musume v2.1.0。当前是独立桌面模式；工作状态联动、MiMo 语音需要 DSH 宿主，余额功能需要本机余额代理。天气填写城市后才联网。</p>
  </main>;
}
function reset() { for(const k of ['floatX','floatY']) localStorage.removeItem('whale-moe:'+k); localStorage.setItem('whale-moe:pet','1');notifyPrefs(); }
document.getElementById('settings-trigger').addEventListener('click',openSettings);
window.addEventListener('keydown',event=>{if(event.key==='Escape') closeSettings();});
desktop.onAction(action=>{
  if(action==='settings') openSettings();
  if(action==='pause') music.pause();
  if(action==='reset') reset();
  if(action==='show') {localStorage.setItem('whale-moe:pet','1');notifyPrefs();}
});
// Implement only the two DSH slots consumed by the upstream plugin.
const slots={inject:(_name,cb)=>cb(),register:(spec,component)=>{if(spec.name==='settings.section') settingsComponent=component;}};
const ctx={get:name=>name==='slots'?slots:undefined,effect:fn=>fn()};
window.__ModuleLoader__={load:({factory})=>factory(name=>{
  if(name==='react')return React;
  if(name==='react/jsx-runtime')return jsxRuntime;
  throw new Error('Unsupported upstream module: '+name);
}).apply(ctx)};

let held=false, lastHit=false;
const masks=new WeakMap();
function hitImage(img,x,y) {
  if(!img.complete || !img.naturalWidth)return false;
  const r=img.getBoundingClientRect();
  const scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);
  const ix=Math.floor((x-r.x-(r.width-img.naturalWidth*scale)/2)/scale);
  const iy=Math.floor((y-r.y-(r.height-img.naturalHeight*scale)/2)/scale);
  if(ix<0||iy<0||ix>=img.naturalWidth||iy>=img.naturalHeight)return false;
  let mask=masks.get(img);
  if(!mask || mask.src!==img.currentSrc) {
    const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
    mask={src:img.currentSrc,data:c.getImageData(0,0,canvas.width,canvas.height).data};masks.set(img,mask);
  }
  return mask.data[(iy*img.naturalWidth+ix)*4+3]>20;
}
function updatePointer({x,y}) {
  const el=document.elementFromPoint(x,y);
  const frame=el?.closest('[data-dsh-whale-frame]');
  const img=frame?.querySelector('img.dsh-whale-active');
  const onPet=Boolean(img && hitImage(img,x,y));
  const control=el?.closest('#settings-root,[data-dsh-whale-context],[data-dsh-whale-prefs],[data-dsh-whale-game],[data-dsh-whale-game-overlay],[data-dsh-whale-catch],button,input,select,[data-dsh-whale-bubble]');
  const interactive=held || onPet || Boolean(control);
  if(interactive!==lastHit){lastHit=interactive;desktop.interactive(interactive);}
}
desktop.onCursor(updatePointer);
window.addEventListener('pointerdown',event=>{if(event.button===0){held=true;desktop.interactive(true);lastHit=true;}},true);
window.addEventListener('pointerup',()=>{held=false;},true);
window.addEventListener('pointercancel',()=>{held=false;},true);
window.addEventListener('blur',()=>{held=false;});
// Add direct music/settings controls to the existing interaction menu.
new MutationObserver(()=>{
  for(const game of document.querySelectorAll('[data-dsh-whale-game],[data-dsh-whale-catch]')) {
    if(game.dataset.desktopExtended)continue;
    game.dataset.desktopExtended='1';
    const close=document.createElement('button');close.textContent='退出游戏';close.className='desktop-game-close';
    close.onclick=()=>game.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    game.prepend(close);
  }
  const menu=document.querySelector('[data-dsh-whale-context]');
  if(!menu || menu.dataset.desktopExtended)return;
  menu.dataset.desktopExtended='1';
  for(const [text,action] of [['音乐与桌面设置',openSettings],['暂停音乐',()=>music.pause()],['退出桌宠',()=>desktop.quit()]]) {
    const button=document.createElement('button');button.textContent=text;button.onclick=()=>{action();menu.remove();};menu.appendChild(button);
  }
  menu.style.top=Math.max(8,Math.min(parseFloat(menu.style.top),innerHeight-menu.offsetHeight-12))+'px';
}).observe(document.body,{childList:true,subtree:true});
audio.addEventListener('error',()=>{if(audio.getAttribute('src')){musicError='无法读取这首歌曲，请检查文件或换一首。';render();}});
window.__whaleDesktop={audio,music,updatePointer,openSettings,refreshSongs};
refreshSongs();
