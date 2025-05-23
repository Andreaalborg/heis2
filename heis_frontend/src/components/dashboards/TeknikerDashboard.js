import React from 'react';
import { Link } from 'react-router-dom';

const TeknikerDashboard = () => {
    return (
        <section className="section">
            <div className="container">
                <h1 className="title is-2">Tekniker Dashboard</h1>
                <p className="subtitle">Velkommen til ditt dashboard.</p>

                <div className="columns is-multiline">
                    {/* Eksempel-widget 1: Mine oppdrag */}
                    <div className="column is-one-third">
                        <div className="card">
                            <header className="card-header">
                                <p className="card-header-title">
                                    <span className="icon is-small mr-2"><i className="fas fa-clipboard-list"></i></span>
                                    Mine aktive oppdrag
                                </p>
                            </header>
                            <div className="card-content">
                                <div className="content">
                                    Du har <strong>3</strong> aktive oppdrag.
                                </div>
                            </div>
                            <footer className="card-footer">
                                <Link to="/assignments?filter=mine" className="card-footer-item">Se mine oppdrag</Link>
                            </footer>
                        </div>
                    </div>

                    {/* Eksempel-widget 2: Kalender */}
                    <div className="column is-one-third">
                        <div className="card">
                            <header className="card-header">
                                <p className="card-header-title">
                                    <span className="icon is-small mr-2"><i className="fas fa-calendar-alt"></i></span>
                                    Dagens kalender
                                </p>
                            </header>
                            <div className="card-content">
                                <div className="content">
                                    Se dagens planlagte oppdrag.
                                </div>
                            </div>
                            <footer className="card-footer">
                                <Link to="/calendar" className="card-footer-item">Vis kalender</Link>
                            </footer>
                        </div>
                    </div>

                    {/* Eksempel-widget 3: Hurtiglenker */}
                    <div className="column is-one-third">
                        <div className="card">
                            <header className="card-header">
                                <p className="card-header-title">
                                    <span className="icon is-small mr-2"><i className="fas fa-link"></i></span>
                                    Hurtiglenker
                                </p>
                            </header>
                            <div className="card-content">
                                <div className="content">
                                    <ul className="list is-hoverable">
                                        <li className="list-item"><Link to="/assignments">Alle oppdrag</Link></li>
                                        {/* Legg til flere relevante lenker her */}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Flere widgets kan legges til her */}
                </div>
            </div>
        </section>
    );
};

export default TeknikerDashboard; 