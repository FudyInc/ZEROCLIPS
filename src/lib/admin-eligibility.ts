export function isDesignatedAdmin(user:{email?:string;email_confirmed_at?:string;is_anonymous?:boolean},designatedEmail:string|undefined){
 return !!designatedEmail?.trim() && !!user.email_confirmed_at && !user.is_anonymous && user.email?.trim().toLowerCase()===designatedEmail.trim().toLowerCase();
}
