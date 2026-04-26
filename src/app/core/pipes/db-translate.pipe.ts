import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dbTranslate',
  standalone: true
})
export class DbTranslatePipe implements PipeTransform {
  
  transform(value: string | undefined | null, prefix: string): string {
    if (!value) return '';

    const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const key = normalized
      .toUpperCase()
      .replace(/\s+/g, '_')         
      .replace(/[^A-Z0-9_]/g, '');  

    return `${prefix}.${key}`;
  }
}