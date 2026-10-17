/**
 * Anfrage aufnehmen — 5-Schritt-Wizard.
 * Steps: 1) Kunden wählen → 2) Anfragedaten und Kundenanforderungen → 3) Verantwortlicher, Priorität, Zieltermin
 *        → 4) Optional erste Quelle → 5) Prüfen & anlegen.
 * Reads: kunden. Writes: kundenanfragen, informationsquellen (optional, verknüpft mit der neuen Anfrage).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText } from '@/lib/journey';
import { useAnfrageAufnehmenFlow } from '@/lib/journey/flows/AnfrageAufnehmen';
import { tx } from '@/i18n';

export default function AnfrageAufnehmenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnfrageAufnehmenFlow({
    steps: {
      kunde: 1,
      eingangskanal: 2, kundenreferenz: 2, produktfamilie: 2, produktvariante: 2, gewuenschte_menge: 2,
      gewuenschter_liefertermin: 2, anfragebeschreibung: 2, urspruengliche_kundenanforderungen: 2,
      prioritaet: 3, verantwortlicher_vorname: 3, verantwortlicher_nachname: 3, zieltermin_klaerung: 3,
      quellentyp: 4, titel: 4, referenz_url: 4, urheber: 4, quellendatum: 4,
    },
    items: {
      kunde: k => ({
        id: k.id,
        title: fieldText(k, 'firmenname'),
        subtitle: [fieldText(k, 'kundennummer'), fieldText(k, 'ansprechpartner_nachname')].filter(Boolean).join(' · '),
      }),
    },
  });
  const anfrage = flow.forms.kundenanfragen;
  const quelle = flow.forms.informationsquellen;

  return (
    <IntentWizardShell
      title={tx('Anfrage aufnehmen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine neue Kundenanfrage mit ihren Anforderungen erfassen.'),
        needs: [tx('Kunde'), tx('Beschreibung der Anfrage'), tx('Originaltext der Kundenanforderungen')],
      }}
    >
      <WizardStep label={tx('Kunde')} description={tx('Von welchem Kunden kommt die Anfrage?')}>
        <EntitySelectStep
          {...flow.picks.kunde.select}
          {...flow.pick('kunde')}
          searchPlaceholder={tx('Firma, Ansprechpartner oder Kundennummer …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Anfrage')}
        description={tx('Worum geht es? Kundenanforderungen bitte unverändert übernehmen.')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={anfrage} name="eingangskanal" />
          <Bound form={anfrage} name="kundenreferenz" />
          <Bound form={anfrage} name="produktfamilie" />
          <Bound form={anfrage} name="produktvariante" />
          <Bound form={anfrage} name="gewuenschte_menge" />
          <Bound form={anfrage} name="gewuenschter_liefertermin" />
          <Bound form={anfrage} name="anfragebeschreibung" rows={4} />
          <Bound form={anfrage} name="urspruengliche_kundenanforderungen" rows={5} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Verantwortlicher')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Zuständigkeit')}
        description={tx('Wer kümmert sich darum, wie dringend ist es und bis wann soll es geklärt sein?')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={anfrage} name="prioritaet" />
          <Bound form={anfrage} name="verantwortlicher_vorname" />
          <Bound form={anfrage} name="verantwortlicher_nachname" />
          <Bound form={anfrage} name="zieltermin_klaerung" />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Erste Quelle')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Erste Quelle')}
        description={tx('Optional: E-Mail, Zeichnung oder Notiz zur Anfrage ablegen. Ohne Titel wird keine Quelle angelegt.')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={quelle} name="quellentyp" />
          <Bound form={quelle} name="titel" />
          <Bound form={quelle} name="referenz_url" />
          <Bound form={quelle} name="urheber" />
          <Bound form={quelle} name="quellendatum" />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => (quelle.get('titel') ? flow.validateStep(4) : true)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'status', label: tx('Status'), value: tx('Neu') },
              { key: 'vollstaendigkeit', label: tx('Vollständigkeit'), value: tx('Ungeprüft') },
            ]}
            whatHappensNext={tx('Die Anfragenummer vergibt das System. Danach kannst du die technischen Anforderungen erfassen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Anforderungen erfassen'), href: '#/intents/anforderungen-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
