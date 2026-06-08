import {createNavigation} from 'next-intl/navigation';
import {routing} from './locales';

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
