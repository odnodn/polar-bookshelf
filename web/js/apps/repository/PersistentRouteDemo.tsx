import React from 'react';
import isEqual from "react-fast-compare";
import {HashRouter, Link, Switch} from "react-router-dom";
import {Route} from "react-router-dom";
import {PersistentRoute} from "./PersistentRoute";

export const PersistentRouteDemo = React.memo(() => {

    return (

        <div>

            these are the persistent routes


            <HashRouter key="browser-router">

                <Link to="/hello">
                    hello
                </Link>

                <Link to="/world">
                    world
                </Link>

                <Switch>
                    <PersistentRoute exact path='/hello'>
                        <div>this is the hello page</div>
                    </PersistentRoute>

                    <Route exact path='/world'>
                        <div>this is the world page</div>
                    </Route>

                </Switch>

            </HashRouter>


        </div>

    );

}, isEqual);
