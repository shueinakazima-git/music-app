(async ()=>{
  const base = 'http://localhost:3000';
  const pretty = o=>{
    try{return JSON.stringify(o,null,2)}catch(e){return String(o)}
  }
  const doReq = async (method, path, body) => {
    const opts = { method, headers: {} };
    if(body){ opts.headers['content-type']='application/json'; opts.body=JSON.stringify(body); }
    const res = await fetch(base+path, opts);
    const text = await res.text();
    let parsed;
    try{ parsed = JSON.parse(text); }catch(e){ parsed = text }
    return { status: res.status, body: parsed };
  }

  try{
    console.log('\n== CREATE Creator ==');
    let r = await doReq('POST','/creators',{creator_name:'CRUD Test Creator', creator_type:'SOLO'});
    console.log('status',r.status); console.log(pretty(r.body));
    const cid = r.body && r.body.creator_id;
    if(!cid) throw new Error('creator_id not returned');

    console.log('\n== UPDATE Creator ==');
    r = await doReq('PUT',`/creators/${cid}`,{creator_name:'CRUD Creator Updated', creator_type:'SOLO'});
    console.log('status',r.status); console.log(pretty(r.body));

    console.log('\n== READ Creator List (verify) ==');
    r = await doReq('GET','/creators');
    console.log('status',r.status); console.log(pretty(r.body.find(c=>Number(c.CREATOR_ID)===Number(cid)) || 'NOT_FOUND'));

    console.log('\n== CREATE Tag ==');
    r = await doReq('POST','/tags',{tag_name:'CRUD Tag', note:'note'});
    console.log('status',r.status); console.log(pretty(r.body));
    const tid = r.body && r.body.tag_id;
    if(!tid) throw new Error('tag_id not returned');

    console.log('\n== UPDATE Tag ==');
    r = await doReq('PUT',`/tags/${tid}`,{tag_name:'CRUD Tag Updated', note:'updated'});
    console.log('status',r.status); console.log(pretty(r.body));

    console.log('\n== DELETE Tag ==');
    r = await doReq('DELETE',`/tags/${tid}`);
    console.log('status',r.status); console.log(pretty(r.body));

    console.log('\n== VERIFY Tag Gone ==');
    r = await doReq('GET','/tags');
    console.log('status',r.status); console.log(pretty((r.body || []).find(t=>Number(t.TAG_ID)===Number(tid)) || 'NOT_FOUND'));

    console.log('\n== CREATE Music ==');
    r = await doReq('POST','/music',{title:'CRUD Test Song', creator_id:cid, bpm:120, musical_key:'C', duration_seconds:180});
    console.log('status',r.status); console.log(pretty(r.body));

    console.log('\n== FIND Music by creator ==');
    r = await doReq('GET',`/music?creator_id=${cid}`);
    console.log('status',r.status); console.log(pretty(r.body));
    const m = (r.body||[]).find(x=>x.MUSIC_TITLE==='CRUD Test Song');
    const mid = m && m.MUSIC_ID;
    if(!mid) console.log('Created music not found, skipping update/delete');
    else{
      console.log('\n== UPDATE Music ==');
      r = await doReq('PUT',`/music/${mid}`,{title:'CRUD Test Song Updated', bpm:100, musical_key:'Dm', duration_seconds:200});
      console.log('status',r.status); console.log(pretty(r.body));

      console.log('\n== DELETE Music ==');
      r = await doReq('DELETE',`/music/${mid}`);
      console.log('status',r.status); console.log(pretty(r.body));
    }

    console.log('\n== DELETE Creator ==');
    r = await doReq('DELETE',`/creators/${cid}`);
    console.log('status',r.status); console.log(pretty(r.body));

    console.log('\nCRUD sequence finished');
    process.exit(0);
  }catch(e){ console.error('ERROR',e); process.exit(2); }
})();
