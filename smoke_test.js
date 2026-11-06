// 사용법: node smoke_test.js <html경로> <스크린샷폴더> <route1,route2,...>
// 아티팩트용(skeleton 없는) HTML과 독립 실행 HTML 모두 지원. 각 라우트 스크린샷 + 오류 + 400px 넘침 보고.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const [file,outDir,routesArg]=process.argv.slice(2);
  if(!file||!outDir){console.error('usage: node smoke_test.js <html> <outDir> <routes>');process.exit(1)}
  fs.mkdirSync(outDir,{recursive:true});
  const routes=(routesArg||'').split(',').filter(Boolean);
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const html=fs.readFileSync(file,'utf8');
  if(/^\s*<!doctype/i.test(html)) await p.goto('file://'+path.resolve(file));
  else await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
  await p.waitForTimeout(400);
  for(const r of (routes.length?routes:[''])){
    if(r) await p.evaluate(r=>{location.hash=r},r);
    await p.waitForTimeout(350);
    await p.screenshot({path:path.join(outDir,(r||'home')+'.png')});
    await p.setViewportSize({width:400,height:800});await p.waitForTimeout(150);
    const w=await p.evaluate(()=>document.documentElement.scrollWidth);
    if(w>400) errs.push(`[${r}] 400px 폭에서 가로 넘침: ${w}px`);
    await p.screenshot({path:path.join(outDir,(r||'home')+'-mobile.png')});
    await p.setViewportSize({width:1300,height:900});
  }
  console.log(errs.length?'문제:\n'+errs.join('\n'):'오류 없음');
  await b.close();
})();
