import { Component, Input, OnInit } from '@angular/core';
import { CharacService } from '../../services/charac.service';

@Component({
  selector: 'app-character-image',
  templateUrl: './character-image.component.html',
  styleUrls: ['./character-image.component.css']
})
export class CharacterImageComponent implements OnInit {
  @Input() characId!: number;
  @Input() alt: string = 'Character';

  imageUrl: string | null = null;
  loading: boolean = true;

  constructor(private characService: CharacService) {}

  ngOnInit() {
    this.loadImage();
  }

  private loadImage() {
    this.characService.getCharacImageUrl(this.characId).subscribe({
      next: (url) => {
        this.imageUrl = url;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.loading = false;
      }
    });
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.error('Image failed to load:', img.src);
    this.imageUrl = `${this.characService.imageBaseUrl}/images/default.png`;
  }
}