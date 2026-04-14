import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/model/customer.model';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-admin-notifications-new',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, QuillModule],
  templateUrl: './admin-notifications-new.html',
  styleUrls: ['./admin-notifications-new.scss']
})
export class AdminNotifications implements OnInit {

  private customerService = inject(CustomerService);

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

  async send() {
    this.sending.set(true);
    this.resultMessage.set('');
    this.errors.set([]);
    await new Promise(res => setTimeout(res, 1200));
    const total = this.selectedIds().length;
    this.resultMessage.set(`Sent to ${total} customers`);
    this.sending.set(false);
    this.message.set('');
    this.selectedIds.set([]);
    this.previewUrl.set(null);
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