const {test}=require('node:test'),assert=require('node:assert/strict');
const {ClickMusic}=require('../music.cjs');
function setup(){
 const events={};const audio={src:'song.mp3',paused:true,ended:false,currentTime:15,volume:.4,loop:true,plays:0,
 getAttribute(){return this.src;},addEventListener(name,fn){events[name]=fn;},pause(){this.paused=true;},
 async play(){this.paused=false;this.ended=false;this.plays++;}};
 return {audio,music:new ClickMusic(audio),events};
}
test('click plays, second pauses, third resumes same position',async()=>{const {audio,music}=setup();music.toggle();await Promise.resolve();assert.equal(audio.paused,false);music.toggle();assert.equal(audio.paused,true);assert.equal(audio.currentTime,15);music.toggle();await Promise.resolve();assert.equal(audio.paused,false);assert.equal(audio.currentTime,15);});
test('song ends without looping and next click starts from beginning',async()=>{const {audio,music,events}=setup();music.toggle();await Promise.resolve();assert.equal(audio.loop,false);audio.paused=true;audio.ended=true;events.ended();assert.equal(music.wantsPlayback,false);music.toggle();await Promise.resolve();assert.equal(audio.currentTime,0);assert.equal(audio.paused,false);});
test('changing volume does not pause playback; disabling does',async()=>{const {audio,music}=setup();music.toggle();await Promise.resolve();music.configure({volume:.7});assert.equal(audio.paused,false);music.configure({enabled:false});assert.equal(audio.paused,true);music.toggle();assert.equal(audio.paused,true);});
test('late play resolution cannot undo a second-click pause',async()=>{const {audio,music}=setup();let resolve;audio.play=()=>new Promise(r=>{resolve=()=>{audio.paused=false;r();};});music.toggle();music.toggle();resolve();await Promise.resolve();assert.equal(audio.paused,true);});
