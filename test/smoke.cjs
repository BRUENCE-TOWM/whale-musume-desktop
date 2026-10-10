const {_electron:electron}=require('playwright');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const out=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'whale-smoke-'));
 // Generate original silent PCM data; no personal or copyrighted music needed.
 const samples=44100*4, wav=Buffer.alloc(44+samples*2);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 fs.writeFileSync(path.join(out,'test-tone.wav'),wav);
 const app=await electron.launch({...(process.env.WHALE_PACKAGED_EXE ? {executablePath:process.env.WHALE_PACKAGED_EXE,args:[]} : {args:[path.resolve(__dirname,'..')]}),env:{...process.env,WHALE_HOME:out,WHALE_TEST_DATA:path.join(out,'profile')},timeout:60000});
 const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
   const frame=page.locator('[data-dsh-whale-frame]');await frame.waitFor();
   await page.waitForFunction(()=>window.__whaleDesktop.audio.readyState>=1);
   const click=()=>frame.dispatchEvent('click',{button:0});
   await page.evaluate(()=>window.__whaleDesktop.updatePointer({x:1,y:1}));
   assert.equal(await page.evaluate(()=>window.__whaleDesktop.audio.paused),true);
   await click();await page.waitForFunction(()=>window.__whaleDesktop.audio.currentTime>.2&&!window.__whaleDesktop.audio.paused);
   await page.evaluate(()=>{window.__whaleDesktop.updatePointer({x:1,y:1});window.dispatchEvent(new Event('blur'));});
   assert.equal(await page.evaluate(()=>window.__whaleDesktop.audio.paused),false);
   await click();const paused=await page.evaluate(()=>({paused:window.__whaleDesktop.audio.paused,time:window.__whaleDesktop.audio.currentTime}));assert.equal(paused.paused,true);
   await click();await page.waitForFunction(t=>window.__whaleDesktop.audio.currentTime>t+.2,paused.time);
   await page.evaluate(()=>{const a=window.__whaleDesktop.audio;a.currentTime=a.duration-.35;});
   await page.waitForTimeout(1500);
   console.log('end probe',await page.evaluate(()=>{const a=window.__whaleDesktop.audio;return {time:a.currentTime,duration:a.duration,paused:a.paused,ended:a.ended,seeking:a.seeking,ready:a.readyState,loop:a.loop,seekable:Array.from({length:a.seekable.length},(_,i)=>[a.seekable.start(i),a.seekable.end(i)])};}));
   await page.waitForFunction(()=>window.__whaleDesktop.audio.ended&&window.__whaleDesktop.audio.paused);
   assert.equal(await page.evaluate(()=>window.__whaleDesktop.audio.loop),false);
   await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__whaleDesktop.audio.paused),true);
   await click();await page.waitForFunction(()=>!window.__whaleDesktop.audio.paused&&window.__whaleDesktop.audio.currentTime<2);
   await frame.dispatchEvent('pointerdown',{button:0,clientX:700,clientY:600});
   await page.evaluate(()=>{window.dispatchEvent(new PointerEvent('pointermove',{clientX:730,clientY:620}));window.dispatchEvent(new PointerEvent('pointerup',{button:0,clientX:730,clientY:620}));});
   await click();assert.equal(await page.evaluate(()=>window.__whaleDesktop.audio.paused),false);
   await page.evaluate(()=>{window.__whaleDesktop.music.pause();window.__whaleDesktop.openSettings();});
   await page.getByRole('heading',{name:'♫ 点击播放音乐'}).waitFor();
   await page.screenshot({path:path.join(out,'click-music-settings.png')});
   assert.deepEqual(errors,[]);
   const result={version:'1.1.1',passed:true,checks:['first click plays','pointer exit and blur preserve playback','second click pauses','third click resumes','real media ended event stops without looping','next click restarts after end','drag does not toggle music','click settings rendered'],paused,errors};
   fs.writeFileSync(path.join(out,'click-smoke.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 } finally {await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
