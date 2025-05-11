import React from 'react';
import { ITranslationProvider } from '../common/ITranslationProvider';
import { PythonWASMProvider } from '../sqlglot-ts/PythonWASMProvider';
import { Route, Routes } from 'react-router-dom';

import { DotLoader } from 'react-spinners';
import { TranspileView } from './transpile-view';
import { NotFoundLabel } from './not-found';
import { useEffect, useState } from 'react';

const draculaPink = '#ff79c6';

const translationProvider : ITranslationProvider = new PythonWASMProvider();

const MainView: React.FC = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function InitializeProvider()
        {
            await translationProvider.Initialize();
            setIsReady(true);
        }

        InitializeProvider();
    }, [])

    return (
        <div className="main-view bg-dracula-background text-dracula-foreground min-h-screen p-4 lg:px-32 xl:px-64 mt-8 lg:mt-16 xl:mt-24 mx-auto my-8 font-sans">
            <header className="main-view-header flex flex-col items-center text-center mb-4">
                <img 
                    src="sqlscope-logo.png" 
                    alt="SQLScope Logo"
                    className="w-24 sm:w-32 md:w-40 lg:w-48 xl:w-56 h-20 sm:h-24 md:h-28 object-cover rounded"
                />
                <h1 className="text-3xl md:text-4xl font-bold text-dracula-logo mt-2 mb-2">SQLScope</h1>
                <p className="text-dracula-pink text-sm sm:text-base md:text-lg">
                    Convert SQL queries effortlessly between different dialects.
                </p>
            </header>
            { isReady &&
                <Routes>
                    <Route path='/' element={<TranspileView translationProvider={translationProvider}/>}/>
                    <Route path='transpile' element={<TranspileView translationProvider={translationProvider}/>}/>
                    <Route path='*' element={NotFoundLabel} />
                </Routes>
            }
            {!isReady && 
            <div className='flex items-center justify-center w-full flex-col mt-20'>
                <DotLoader
                    color={draculaPink}
                    loading={true}
                    size={200}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                    title='Loading'
                    >
                </DotLoader>
                <h2 className='text-dracula-pink mt-10 text-center italic'>
                    Summoning the spirits (fetching dependencies)
                </h2>
            </div>
            }
            
            <footer className="main-view-footer mt-8 text-center text-dracula-comment text-sm">
                <p>&copy; {new Date().getFullYear()} BazookaMusic. Powered by <a href="https://github.com/tobymao/sqlglot">SQLGlot</a> and <a href="https://pyodide.org/en/stable/">Pyodide</a>. 
                <a href="https://www.flaticon.com/free-icons/bird" title="bird icons"> Bird icons created by Freepik - Flaticon.</a></p>
            </footer>
        </div>
    );    
};

export default MainView;
