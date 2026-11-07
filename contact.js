(() => {
  const form=document.querySelector('#contactEnquiry');if(!form)return;
  const subject=form.elements.subject,help=document.querySelector('#contactMessageHelp');
  const hints={
    'Un produit ou une disponibilité':'Indiquez le nom du produit, les références et les quantités souhaitées.',
    'Une installation de caméras':'Précisez le lieu et le nombre de caméras intérieures et extérieures souhaitées.',
    'Une installation solaire':'Précisez les appareils à alimenter, leur durée d’utilisation et la localisation du site.',
    'Un retrait ou une livraison':'Indiquez les produits concernés, les quantités et votre lieu de livraison ou de retrait.',
    'Une autre question':'Décrivez votre demande avec les précisions utiles à l’équipe.'
  };
  subject.addEventListener('change',()=>{help.textContent=hints[subject.value];});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const data=new FormData(form);
    const message=['Bonjour DEPOT DU BATIMENT,','Je souhaite un renseignement.','','Sujet : '+data.get('subject'),'Nom : '+String(data.get('name')).trim(),
      ...(String(data.get('phone')).trim()?['Téléphone : '+String(data.get('phone')).trim()]:[]),
      ...(String(data.get('location')).trim()?['Lieu / commune : '+String(data.get('location')).trim()]:[]),
      '',String(data.get('message')).trim()].join('\n');
    const url='https://wa.me/2250713948524?text='+encodeURIComponent(message);
    document.querySelector('#contactPreparedLink').href=url;
    document.querySelector('#contactFormStatus').hidden=false;
    window.open(url,'_blank','noopener,noreferrer');
  });
})();
