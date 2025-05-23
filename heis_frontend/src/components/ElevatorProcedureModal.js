import React, { useState, useEffect } from 'react';
import Modal from './Modal'; // Bruker samme Modal-komponent
import axios from 'axios'; // Importer axios for fremtidig bruk
// Importer axios hvis vi trenger å hente data, f.eks. heisdetaljer

const ElevatorProcedureModal = ({ isOpen, onClose, assignment }) => {
    // State for hvilket steg som er aktivt
    const [currentStep, setCurrentStep] = useState(1);
    // State for heisdetaljer (hvis vi henter dem)
    // const [elevatorDetails, setElevatorDetails] = useState(null);
    // State for potensiell loading/error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- NY: State for Sjekklister og Notater ---
    const initialStep1Checklist = {
        tools: false,
        parts: false,
        area: false,
        customer: false,
    };
    const initialStep3Checklist = {
        cleanup: false,
        test: false,
        report: false,
        customer_informed: false,
    };
    const [step1Checklist, setStep1Checklist] = useState(initialStep1Checklist);
    const [step2Notes, setStep2Notes] = useState('');
    const [step3Checklist, setStep3Checklist] = useState(initialStep3Checklist);
    // ----------------------------------------------

    // TODO: Hent heisdetaljer basert på assignment.elevator ID når modalen åpnes?
    useEffect(() => {
        if (isOpen && assignment?.elevator) {
            // Eksempel: Hent heisdetaljer
            // fetchElevatorDetails(assignment.elevator);
            setCurrentStep(1); // Start alltid på steg 1
            setStep1Checklist(initialStep1Checklist);
            setStep2Notes('');
            setStep3Checklist(initialStep3Checklist);
            setError('');
        } else {
            // Nullstill state når modalen lukkes
            // setElevatorDetails(null);
            setError('');
            setIsLoading(false);
        }
    }, [isOpen, assignment]);

    // const fetchElevatorDetails = async (elevatorId) => { ... };

    const totalSteps = 3; // Definer antall steg

    // --- NY: Håndtere endring i sjekkbokser ---
    const handleStep1Change = (event) => {
        const { name, checked } = event.target;
        setStep1Checklist(prev => ({ ...prev, [name]: checked }));
    };
    const handleStep3Change = (event) => {
        const { name, checked } = event.target;
        setStep3Checklist(prev => ({ ...prev, [name]: checked }));
    };
    // --------------------------------------------

    // --- Oppdateringer for Neste/Forrige/Fullfør ---
    // Disse kan senere utvides til å lagre status til backend
    const nextStep = async () => {
        if (currentStep < totalSteps) {
            // TODO: Lagre nåværende status (f.eks. step1Checklist, step2Notes) til backend?
            // await saveProgress(currentStep, { checklist: step1Checklist, notes: step2Notes }); 
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            // Ingen lagring nødvendig når man går tilbake?
            setCurrentStep(currentStep - 1);
        }
    };

    const completeProcedure = async () => {
        // TODO: Lagre endelig status (step3Checklist) til backend?
        // await saveProgress(currentStep, { checklist: step3Checklist });
        // TODO: Oppdater Assignment status til f.eks. 'completed' via API?
        console.log("Prosedyre fullført (ingen lagring implementert ennå):", { step1Checklist, step2Notes, step3Checklist });
        onClose(); // Lukk modalen
    };

    // const saveProgress = async (step, data) => { ... API-kall for å lagre ... };
    // --------------------------------------------

    const renderStepContent = () => {
        if (!assignment) return <p>Ingen oppdragsdata tilgjengelig.</p>;
        if (isLoading) return <p>Laster...</p>;
        if (error) return <p className="has-text-danger">{error}</p>;

        switch (currentStep) {
            case 1:
                return (
                    <div>
                        <h3 className="title is-4">Steg 1: Forberedelser</h3>
                        <p>Sjekkliste før arbeidet starter:</p>
                        <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="tools" checked={step1Checklist.tools} onChange={handleStep1Change} />
                                Er riktig verktøy og utstyr medbrakt?
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="parts" checked={step1Checklist.parts} onChange={handleStep1Change} />
                                Er nødvendige reservedeler tilgjengelig?
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="area" checked={step1Checklist.area} onChange={handleStep1Change} />
                                Er området sikret?
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="customer" checked={step1Checklist.customer} onChange={handleStep1Change} />
                                Er kunden informert om ankomst?
                            </label>
                        </div>
                        <p className="mt-3"><strong>Heis ID:</strong> {assignment.elevator}</p>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h3 className="title is-4">Steg 2: Utførelse ({assignment.assignment_type})</h3>
                        <p>Følg relevant monteringsanvisning eller serviceprosedyre.</p>
                        <p><strong>Heis ID:</strong> {assignment.elevator}</p>
                        <div className="field mt-3">
                            <label className="label">Notater underveis:</label>
                            <div className="control">
                                <textarea 
                                    className="textarea" 
                                    placeholder="Legg inn notater for arbeidet..." 
                                    value={step2Notes}
                                    onChange={(e) => setStep2Notes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        {/* Bildeopplasting utsatt 
                        <div className="field mt-3">
                            <label className="label">Legg til bilder (kommer senere):</label>
                            <div className="control">
                                <input type="file" multiple disabled />
                            </div>
                        </div>
                        */}
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="title is-4">Steg 3: Avslutning og Rapport</h3>
                        <p>Sjekkliste etter arbeidet:</p>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="cleanup" checked={step3Checklist.cleanup} onChange={handleStep3Change} />
                                Rydd arbeidsområdet.
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="test" checked={step3Checklist.test} onChange={handleStep3Change} />
                                Funksjonstest heisen.
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="report" checked={step3Checklist.report} onChange={handleStep3Change} />
                                Fyll ut servicerapport/sjekkliste.
                            </label>
                        </div>
                         <div className="field">
                            <label className="checkbox">
                                <input type="checkbox" name="customer_informed" checked={step3Checklist.customer_informed} onChange={handleStep3Change} />
                                Informer kunden om utført arbeid.
                            </label>
                        </div>
                    </div>
                );
            default:
                return <p>Ukjent steg.</p>;
        }
    };

    // Beregn progress for progressbar
    const progressValue = (currentStep / totalSteps) * 100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Prosedyre for Oppdrag: ${assignment?.title || ''}`}>
            {/* NY: Progressbar */}
            <progress className="progress is-info mb-4" value={progressValue} max="100">
                {progressValue}%
            </progress>

            {/* Steg-indikator (valgfri, kan fjernes hvis progressbar er nok) */}
            {/* <div className="steps-indicator mb-4 has-text-centered">
                Steg {currentStep} av {totalSteps}
            </div> */}

            {/* Innhold for gjeldende steg */}
            <div className="step-content mb-4">
                {renderStepContent()}
            </div>

            {/* Navigasjonsknapper */}
            <div className="buttons is-centered">
                {currentStep > 1 && (
                    <button className="button is-light" onClick={prevStep} disabled={isLoading}>
                        Forrige
                    </button>
                )}
                {currentStep < totalSteps && (
                    <button className="button is-info" onClick={nextStep} disabled={isLoading}>
                        Neste
                    </button>
                )}
                {/* Endret siste knapp til å kalle completeProcedure */}
                {currentStep === totalSteps && (
                    <button className="button is-success" onClick={completeProcedure} disabled={isLoading}>
                        Fullfør Prosedyre
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ElevatorProcedureModal; 