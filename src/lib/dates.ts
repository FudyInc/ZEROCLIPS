import {Temporal} from '@js-temporal/polyfill';
export function toInstant(value:string,zone:string){return value?Temporal.PlainDateTime.from(value).toZonedDateTime(zone,{disambiguation:'reject'}).toInstant().toString():'';}
export function toLocal(value:string,zone:string){return value?Temporal.Instant.from(value).toZonedDateTimeISO(zone).toPlainDateTime().toString({smallestUnit:'minute'}):'';}
