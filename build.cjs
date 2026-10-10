const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const upstream=path.resolve(__dirname,'vendor/dsh-whale-musume');
fs.mkdirSync(path.join(__dirname,'upstream'),{recursive:true});
for(const item of ['assets','LICENSE','README.md','package.json']) fs.cpSync(path.join(upstream,item),path.join(__dirname,'upstream',item),{recursive:true});
fs.copyFileSync(path.join(upstream,'lib/client.js'),path.join(__dirname,'public/upstream-client.js'));
// Desktop-only layout adaptation; all other upstream behavior is retained.
const presenter=path.join(__dirname,'upstream/assets/dsh-whale-moe.js');
let source=fs.readFileSync(presenter,'utf8');
for(const [from,to] of [['var fw = 200;','var fw = Math.min(360, Math.max(120, Number(root.localStorage.getItem("desktop:size")) || 240));'],['var fh = 200;','var fh = fw;'],['root.innerHeight - 160','root.innerHeight - menu.offsetHeight - 12'],['thinking: thinkingActive,','thinking: false,'],['tool: toolActive,','tool: false,']]) {
  if(source.split(from).length!==2) throw new Error('Upstream patch mismatch: '+from);
  source=source.replace(from,to);
}
const clickAnchor='if (suppressClick) { suppressClick = false; return; }';
if(source.split(clickAnchor).length!==2) throw new Error('Upstream click patch mismatch');
source=source.replace(clickAnchor,clickAnchor+'\n      root.dispatchEvent(new CustomEvent("whale-desktop-click"));');
fs.writeFileSync(presenter,source);
esbuild.buildSync({entryPoints:[path.join(__dirname,'renderer.jsx')],bundle:true,outfile:path.join(__dirname,'public/desktop.js'),define:{'process.env.NODE_ENV':'"production"'},minify:true});
