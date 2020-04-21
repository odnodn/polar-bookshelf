import * as React from 'react';
import {arrayStream} from "polar-shared/src/util/ArrayStreams";
import {
    ReactRouterLinks,
    RouterLink
} from "../../../web/js/ui/ReactRouterLinks";
import Tabs from '@material-ui/core/Tabs';
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import Tab from "@material-ui/core/Tab";
import {Link, useLocation} from 'react-router-dom';
import isEqual from 'react-fast-compare';
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";

// const NavTab = () => (
//
// )

const useStyles = makeStyles((theme: Theme) =>
    createStyles({

        link: {
            textDecoration: 'none',
            color: theme.palette.text.secondary
        },

        linkActive: {
            textDecoration: 'none',
            color: theme.palette.text.primary,
        },

    })
);

export interface ITabProps {
    readonly id: number;
    readonly label: string;
    readonly link: RouterLink;
}

interface IProps {
    readonly tabs: ReadonlyArray<ITabProps>;
}

export const NavTabs = React.memo((props: IProps) => {

    const classes = useStyles();

    const location = useLocation();

    const activeTab =
        arrayStream(props.tabs)
            .filter(tab => ReactRouterLinks.isActive(tab.link, location))
            .first();

    const activeTabID = activeTab ? activeTab.id : 0;

    return (

        <Tabs value={activeTabID}
              textColor="inherit"
              onChange={NULL_FUNCTION}>

            {props.tabs.map(tab => (
                <Link key={tab.id}
                      className={tab.id === activeTabID ? classes.linkActive : classes.link}
                      to={tab.link}>
                    <Tab disableFocusRipple
                         disableRipple
                         label={tab.label}/>
                </Link>
            ))}

        </Tabs>

    );
}, isEqual);
