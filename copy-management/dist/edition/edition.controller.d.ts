import { EditionService } from './edition.service';
import { CreateEditionDto } from './dto/create-edition.dto';
import { UpdateEditionDto } from './dto/update-edition.dto';
export declare class EditionController {
    private readonly editionService;
    constructor(editionService: EditionService);
    create(createEditionDto: CreateEditionDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateEditionDto: UpdateEditionDto): string;
    remove(id: string): string;
}
