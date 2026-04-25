import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/model/customer.model';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { QuillModule } from 'ngx-quill';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { NotificationService } from '../../../core/services/notification-service';

@Component({
  selector: 'app-admin-notifications-new',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, QuillModule, TranslocoModule],
  templateUrl: './admin-notifications-new.html',
  styleUrls: ['./admin-notifications-new.scss']
})
export class AdminNotifications implements OnInit {

  private customerService = inject(CustomerService);
  private transloco = inject(TranslocoService);
  private notificationService = inject(NotificationService);

  customers = signal<Customer[]>([]);
  isLoading = signal(true);

  selectedIds = signal<string[]>([]);
  message = signal('');
  maxLength = 1024;

  selectedFile?: File;
  previewUrl = signal<string | null>(null);

  sending = signal(false);
  resultMessage = signal('');
  errors = signal<any[]>([]);

  editorContent = signal('');
  

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);

    this.customerService.getAll(0, 200).subscribe({
      next: res => {
        this.customers.set(res.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleCustomer(id: string) {
    const current = this.selectedIds();

    if (current.includes(id)) {
      this.selectedIds.set(current.filter(i => i !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.selectedIds.set(this.customers().map(c => c.id));
    } else {
      this.selectedIds.set([]);
    }
  }

  isSelected(id: string) {
    return this.selectedIds().includes(id);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  convertToWhatsAppFormat(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
  
    div.querySelectorAll('strong, b').forEach(el => {
      el.outerHTML = `*${el.textContent}*`;
    });

    div.querySelectorAll('em, i').forEach(el => {
      el.outerHTML = `_${el.textContent}_`;
    });
  

    div.querySelectorAll('s, del').forEach(el => {
      el.outerHTML = `~${el.textContent}~`;
    });
  

    div.querySelectorAll('a').forEach(el => {
      const text = el.textContent;
      const href = el.getAttribute('href');
      el.outerHTML = `${text} (${href})`;
    });

    div.querySelectorAll('li').forEach(el => {
      el.outerHTML = `• ${el.textContent}\n`;
    });
  
    return div.textContent || '';
  }

  send() {
    this.sending.set(true);
    this.resultMessage.set('');
    this.errors.set([]);
  
    const whatsappMessage = this.convertToWhatsAppFormat(this.editorContent());

    this.notificationService.sendNotification(
      this.selectedIds(),
      whatsappMessage,
      this.selectedFile
    ).subscribe({
      next: (res) => {
        const { sent, failed } = res;
  
        this.resultMessage.set(
          this.transloco.translate('notifications.result', {
            sent,
            failed
          })
        );
  
        this.message.set('');
        this.editorContent.set('');
        this.selectedIds.set([]);
        this.previewUrl.set(null);
        this.selectedFile = undefined;
        this.sending.set(false);
      },
      error: () => {
        this.resultMessage.set(
          this.transloco.translate('notifications.error')
        );
        this.sending.set(false);
      }
    });
  }

  isMessageEmpty() {
    const text = this.editorContent()
      .replace(/<(.|\n)*?>/g, '')
      .trim();
  
    return !text;
  }

  isDisabled = computed(() => {
    return (
      this.selectedIds().length === 0 ||
      this.isMessageEmpty() ||
      this.sending()
    );
  });

  onEditorChange(value: string) {
    this.editorContent.set(value);
    this.message.set(value);
  }
}